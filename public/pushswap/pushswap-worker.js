/*
 * Worker de push_swap.
 *
 * Le programme ne rend rien d'autre qu'une suite d'opérations sur la sortie
 * standard (« ra pb pa … ») : le worker la renvoie telle quelle, et la démo
 * la rejoue sur ses deux piles. Le tri lui-même est bien calculé par le
 * binaire C, pas refait en JavaScript.
 *
 * Le programme se termine sur un \b (voir pushswap.c) : il n'a rien à faire
 * dans la liste des opérations.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createPushSwap from "./pushswap.js";

self.onmessage = async (event) => {
  const { type, token, numbers } = event.data;
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
    const instance = await createPushSwap(Module);
    instance.callMain(numbers.map(String));
  } catch (error) {
    self.postMessage({
      type: "error",
      token,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const ops = out
    .replace(/[\b]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  self.postMessage({ type: "result", token, ops });
};
