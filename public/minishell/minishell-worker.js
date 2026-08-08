/*
 * Worker de minishell.
 *
 * Le programme ne rend jamais la main tant qu'il n'a pas lu un EOF sur
 * stdin (sa boucle `while (1)` interne) : pas d'Asyncify ici, à la place
 * chaque commande soumise rejoue tout l'historique depuis le début, sur une
 * instance WASM fraîche, stdin étant un buffer déjà entièrement connu plutôt
 * qu'un flux à attendre. `cd`/`setenv` retrouvent donc leur effet à chaque
 * rejeu, puisque tout l'historique s'exécute à nouveau dans l'ordre.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createMinishell from "./minishell.js";

self.onmessage = async (event) => {
  const { type, token, transcript } = event.data;
  if (type !== "run") return;

  const chars = [...transcript].map((c) => c.charCodeAt(0));
  let idx = 0;
  let out = "";

  const Module = {
    stdin: () => (idx < chars.length ? chars[idx++] : null),
    print: (text) => {
      out += text + "\n";
    },
    printErr: (text) => {
      out += text + "\n";
    },
  };

  try {
    await createMinishell(Module);
  } catch (error) {
    out += `\n[erreur d'exécution] ${error instanceof Error ? error.message : error}\n`;
  }

  self.postMessage({ type: "result", token, output: out });
};

// Un postMessage envoyé avant l'attache de ce handler serait perdu (pas de
// file d'attente avant `self.onmessage`) : le composant attend ce signal
// avant d'activer la saisie plutôt que de le supposer immédiat.
self.postMessage({ type: "ready" });
