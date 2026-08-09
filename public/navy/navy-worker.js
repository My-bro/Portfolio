/*
 * Worker de navy.
 *
 * Un worker par camp : le module garde la grille, la flotte et le compteur
 * de signaux du joueur qu'il incarne. En local, la page en lance deux et
 * fait passer les salves de l'un à l'autre ; en ligne, elle n'en lance
 * qu'un et le relais passe par /api/navy.
 *
 * Fichier servi tel quel depuis public/ : il importe la glue Emscripten par
 * un chemin relatif. Aucun bundler n'intervient.
 */

import createNavy from "./navy.js";

let api = null;
let booting = null;

async function boot() {
  const module = await createNavy();
  return {
    init: module.cwrap("navy_init", "number", ["string"]),
    board: module.cwrap("navy_board", "string", ["number"]),
    valid: module.cwrap("navy_valid", "number", ["string"]),
    encode: module.cwrap("navy_encode", "string", ["string"]),
    decode: module.cwrap("navy_decode", "string", ["string"]),
    incoming: module.cwrap("navy_incoming", "number", ["string"]),
    result: module.cwrap("navy_result", "number", ["number"]),
  };
}

const boards = () => ({ own: api.board(0), enemy: api.board(1) });

self.onmessage = async (event) => {
  const { type, token } = event.data;
  booting ??= boot();

  try {
    api ??= await booting;
  } catch (error) {
    self.postMessage({ type: "error", token, message: String(error) });
    return;
  }

  if (type === "init") {
    const code = api.init(event.data.layout);
    self.postMessage({ type: "ready", token, code, ...boards() });
    return;
  }

  if (type === "fire") {
    // Rend la salve de signaux à transmettre, ou une chaîne vide si la
    // coordonnée n'est pas dans « A1 »–« H8 ».
    const train = api.encode(event.data.coord);
    self.postMessage({ type: "fired", token, coord: event.data.coord, train });
    return;
  }

  if (type === "incoming") {
    // La salve est décodée par le code du dépôt, signal par signal.
    const coord = api.decode(event.data.train);
    if (!coord) {
      self.postMessage({ type: "partial", token });
      return;
    }
    const outcome = api.incoming(coord);
    self.postMessage({
      type: "answered",
      token,
      coord,
      answer: outcome === 0 ? "miss" : outcome === 2 ? "sunk" : "hit",
      ...boards(),
    });
    return;
  }

  if (type === "answer") {
    const won = api.result(event.data.answer === "miss" ? 0 : 1);
    self.postMessage({ type: "resolved", token, won: won === 1, ...boards() });
  }
};
