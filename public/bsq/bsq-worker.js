/*
 * Worker de bsq.
 *
 * Contrairement à Dante, l'algorithme n'a qu'une seule passe (recherche du
 * plus grand carré par programmation dynamique) : pas de trace à rejouer,
 * juste la grille finale, carré trouvé marqué en 'x'.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createBsq from "./bsq.js";

self.onmessage = async (event) => {
  const { type, token, size, pattern } = event.data;
  if (type !== "run") return;

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
    const instance = await createBsq(Module);
    instance.callMain([String(size), pattern]);
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
