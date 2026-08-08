/*
 * Worker du solveur de labyrinthe de Dante.
 *
 * Le binaire écrit sa trace d'exécution réelle sur stdout ("V x y" par case
 * explorée pendant le BFS, "P x y" par case du chemin trouvé — voir
 * solver.c) : ce worker se contente de la capturer et de la renvoyer telle
 * quelle, la démo l'anime ensuite au fil principal.
 *
 * Le générateur du même dépôt (vendor/dante/generator) est compilé à côté :
 * les labyrinthes « créés » depuis la démo sortent donc du vrai générateur,
 * pas d'un bricolage JavaScript.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createDante from "./dante.js";
import createDanteGen from "./dante-gen.js";

async function capture(create, use) {
  let out = "";
  const Module = {
    print: (text) => {
      out += text + "\n";
    },
    printErr: (text) => {
      out += text + "\n";
    },
  };
  const instance = await create(Module);
  use(instance);
  return out;
}

self.onmessage = async (event) => {
  const { type, token } = event.data;

  try {
    if (type === "generate") {
      const { width, height, kind, seed } = event.data;
      const maze = await capture(createDanteGen, (instance) =>
        instance.callMain([String(width), String(height), kind, String(seed)]),
      );
      // Le générateur ne termine pas sa dernière ligne : la trace capturée
      // ligne à ligne la referme, on rogne juste le blanc final.
      self.postMessage({ type: "generated", token, mazeText: maze.replace(/\n+$/, "") + "\n" });
      return;
    }

    if (type === "solve") {
      const { mazeText } = event.data;
      const out = await capture(createDante, (instance) => {
        instance.FS.writeFile("/maze.txt", mazeText);
        instance.callMain(["/maze.txt"]);
      });
      self.postMessage({ type: "result", token, output: out });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      token,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
