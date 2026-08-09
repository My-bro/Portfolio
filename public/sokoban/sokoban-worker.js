/*
 * Worker de my_sokoban.
 *
 * Le module garde l'état de la partie entre deux touches (la carte, la
 * position du joueur, les caisses) : contrairement à bsq ou Dante, il n'est
 * pas instancié à chaque message mais une seule fois, et chaque message
 * joue un tour.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createSokoban from "./sokoban.js";

let api = null;

async function boot() {
  const module = await createSokoban();
  return {
    load: module.cwrap("sok_load", "number", ["string"]),
    step: module.cwrap("sok_step", "string", ["number"]),
    state: module.cwrap("sok_state", "number", []),
  };
}

let booting = null;

self.onmessage = async (event) => {
  const { type, token } = event.data;
  booting ??= boot();

  try {
    api ??= await booting;
  } catch (error) {
    self.postMessage({
      type: "error",
      token,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (type === "load") {
    const code = api.load(event.data.map);
    if (code !== 0) {
      self.postMessage({ type: "error", token, message: "carte invalide" });
      return;
    }
  } else if (type !== "key") {
    return;
  }

  // Une touche de 0 ne correspond à aucun KEY_* : le tour ne bouge rien et
  // rend simplement l'écran, ce qui sert au premier rendu après `load`.
  const screen = api.step(type === "key" ? event.data.key : 0);
  self.postMessage({ type: "screen", token, screen, state: api.state() });
};
