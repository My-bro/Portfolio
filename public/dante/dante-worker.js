/*
 * Worker du solveur de labyrinthe de Dante.
 *
 * Le binaire écrit sa trace d'exécution réelle sur stdout ("V x y" par case
 * explorée pendant le BFS, "P x y" par case du chemin trouvé — voir
 * solver.c) : ce worker se contente de la capturer et de la renvoyer telle
 * quelle, la démo l'anime ensuite au fil principal.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createDante from "./dante.js";

self.onmessage = async (event) => {
  const { type, token, mazeText } = event.data;
  if (type !== "solve") return;

  let out = "";
  const Module = {
    print: (text) => {
      out += text + "\n";
    },
    printErr: (text) => {
      out += text + "\n";
    },
  };

  try {
    const instance = await createDante(Module);
    instance.FS.writeFile("/maze.txt", mazeText);
    instance.callMain(["/maze.txt"]);
  } catch (error) {
    self.postMessage({
      type: "error",
      token,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  self.postMessage({ type: "result", token, output: out });
};
