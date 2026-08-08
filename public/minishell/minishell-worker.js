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
 * Le système de fichiers ci-dessous est monté avant chaque exécution : sans
 * lui, `ls` et `cat` n'auraient rien à montrer — un bac à sable WebAssembly
 * démarre sur un disque vide. Les commandes, elles, sont du vrai code C
 * (voir vendor/minishell/wasm/demo_commands.c).
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createMinishell from "./minishell.js";

const HOME = "/home/axel";

const TREE = {
  [`${HOME}/README.txt`]: [
    "Bac a sable minishell.",
    "",
    "Les commandes ls, cat, echo, grep, wc, head, sort, uniq, rev et pwd",
    "tournent ici en WebAssembly, sur ce disque en memoire.",
    "Les operateurs | ; && et || fonctionnent.",
    "",
    "Essaie : cat projets.txt | sort | head -n 3",
  ].join("\n"),
  [`${HOME}/projets.txt`]: [
    "dante — resolution de labyrinthe (BFS)",
    "bsq — plus grand carre libre",
    "minishell — ce shell",
    "r-type — moteur de jeu C++",
    "raytracer — moteur de rendu",
    "area — automatisations",
  ].join("\n"),
  [`${HOME}/notes.txt`]: [
    "fork",
    "execve",
    "pipe",
    "dup2",
    "pipe",
    "waitpid",
  ].join("\n"),
  [`${HOME}/projets/dante/notes.txt`]: "BFS, file maison, reconstruction du chemin.\n",
  [`${HOME}/projets/bsq/notes.txt`]: "Programmation dynamique, cartes 10000x10000.\n",
  [`${HOME}/projets/minishell/notes.txt`]: "Parsing maison, pipes, environnement en liste chainee.\n",
  "/etc/motd": "minishell — projet Epitech 2023, compile en WebAssembly.\n",
};

/** Crée un dossier et ses parents, sans échouer sur l'existant. */
function mkdirp(FS, path) {
  let current = "";
  for (const part of path.split("/").filter(Boolean)) {
    current += `/${part}`;
    try {
      FS.mkdir(current);
    } catch {
      // Le dossier existe déjà (/home et /tmp sont fournis par Emscripten).
    }
  }
}

function mountTree(FS) {
  for (const [path, content] of Object.entries(TREE)) {
    mkdirp(FS, path.slice(0, path.lastIndexOf("/")));
    FS.writeFile(path, content.endsWith("\n") ? content : content + "\n");
  }
  FS.chdir(HOME);
}

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
  // preRun s'exécute une fois le système de fichiers monté mais avant
  // main() : c'est la seule fenêtre où déposer l'arborescence.
  Module.preRun = [() => mountTree(Module.FS)];

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
