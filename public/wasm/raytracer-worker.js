/*
 * Worker du raytracer.
 *
 * Le rendu est du calcul pur : le laisser sur le fil principal figerait la
 * page pendant plusieurs centaines de millisecondes. Ici il tourne à côté,
 * et l'image remonte par tranches de lignes — l'utilisateur la voit se
 * construire au lieu d'attendre devant un canvas vide.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif, qui trouve raytracer.wasm à côté d'elle. Aucun bundler
 * n'intervient.
 */

import createRaytracer from "./raytracer.js";

/** Hauteur d'une tranche : assez petite pour voir l'image progresser. */
const SLICE_ROWS = 16;

let api = null;
/** Incrémenté à chaque nouvelle demande : les tranches en retard sont jetées. */
let generation = 0;

async function init() {
  const instance = await createRaytracer();

  api = {
    instance,
    loadScene: instance.cwrap("rt_load_scene", "number", ["string"]),
    lastError: instance.cwrap("rt_last_error", "string", []),
    setResolution: instance.cwrap("rt_set_resolution", "number", ["number", "number"]),
    renderRows: instance.cwrap("rt_render_rows", null, ["number", "number"]),
    framebuffer: instance.cwrap("rt_framebuffer", "number", []),
    width: instance.cwrap("rt_width", "number", []),
    height: instance.cwrap("rt_height", "number", []),
    nativeWidth: instance.cwrap("rt_native_width", "number", []),
    nativeHeight: instance.cwrap("rt_native_height", "number", []),
    moveCamera: instance.cwrap("rt_move_camera", null, ["number", "number", "number"]),
    resetCamera: instance.cwrap("rt_reset_camera", null, []),
    cameraZ: instance.cwrap("rt_camera_z", "number", []),
    primitiveCount: instance.cwrap("rt_primitive_count", "number", []),
  };
}

/** Copie une tranche du tampon WASM et la transfère au fil principal. */
function postSlice(y0, y1, width, token) {
  const base = api.framebuffer();
  const start = base + y0 * width * 4;
  const length = (y1 - y0) * width * 4;

  // subarray pointe dans la mémoire WASM : il faut copier avant de
  // transférer, sinon on détacherait le tas du module.
  const pixels = new Uint8ClampedArray(
    api.instance.HEAPU8.buffer.slice(start, start + length),
  );

  self.postMessage(
    { type: "rows", token, y0, y1, width, pixels },
    [pixels.buffer],
  );
}

async function render({ scene, width, height, token }) {
  if (api.loadScene(scene) !== 0) {
    self.postMessage({ type: "error", token, message: api.lastError() });
    return;
  }
  runRender({ width, height, token, reload: false });
}

function runRender({ width, height, token }) {
  if (api.setResolution(width, height) !== 0) {
    self.postMessage({ type: "error", token, message: "résolution refusée" });
    return;
  }

  const w = api.width();
  const h = api.height();

  self.postMessage({
    type: "start",
    token,
    width: w,
    height: h,
    primitives: api.primitiveCount(),
    nativeWidth: api.nativeWidth(),
    nativeHeight: api.nativeHeight(),
  });

  const startedAt = performance.now();

  // setTimeout entre les tranches : le worker reste joignable, donc une
  // nouvelle demande peut annuler celle en cours au lieu de faire la queue.
  let y = 0;
  const step = () => {
    if (token !== generation) return;

    const end = Math.min(y + SLICE_ROWS, h);
    api.renderRows(y, end);
    postSlice(y, end, w, token);
    y = end;

    if (y < h) {
      setTimeout(step, 0);
    } else {
      self.postMessage({
        type: "done",
        token,
        ms: Math.round(performance.now() - startedAt),
      });
    }
  };

  step();
}

self.onmessage = async (event) => {
  const message = event.data;

  try {
    if (message.type === "init") {
      if (!api) await init();
      self.postMessage({ type: "ready" });
      return;
    }

    if (!api) return;

    if (message.type === "render") {
      generation += 1;
      await render({ ...message, token: generation });
      return;
    }

    if (message.type === "move") {
      generation += 1;
      api.moveCamera(message.dx, message.dy, message.dz);
      runRender({ width: message.width, height: message.height, token: generation });
      return;
    }

    if (message.type === "reset") {
      generation += 1;
      api.resetCamera();
      runRender({ width: message.width, height: message.height, token: generation });
      return;
    }

    if (message.type === "cancel") {
      generation += 1;
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      token: generation,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
