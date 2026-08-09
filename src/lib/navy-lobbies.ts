import "server-only";

/**
 * Salons de My navy, gardés en mémoire.
 *
 * Une partie de bataille navale dure quelques minutes et ne pèse que
 * quelques dizaines de coups : rien de tout cela ne mérite d'être écrit
 * quelque part. Les salons vivent donc dans l'instance du worker, et
 * disparaissent d'eux-mêmes.
 *
 * Ce que ça implique, et qu'il vaut mieux savoir : deux joueurs doivent
 * tomber sur la même instance. En pratique deux personnes qui jouent
 * ensemble passent par la même bordure Cloudflare et se retrouvent ; deux
 * continents différents, ou une instance recyclée entre-temps, et le code
 * de salon devient introuvable. La fiche le dit, et le mode local ne
 * dépend de rien.
 */

const HOUR = 3_600_000;

/** Plafond volontairement bas : cette mémoire n'est pas une base. */
const MAX_LOBBIES = 50;

export interface Move {
  id: number;
  side: "host" | "guest";
  kind: "fire" | "answer";
  payload: string;
}

export interface Lobby {
  code: string;
  created: number;
  hostToken: string;
  guestToken: string | null;
  moves: Move[];
  nextId: number;
}

/**
 * La table est accrochée à l'objet global, et pas simplement au module :
 * chaque route est un module à part, et deux copies de cette table
 * signifieraient un salon créé d'un côté et introuvable de l'autre. C'est
 * aussi ce qui la fait survivre au rechargement à chaud en développement.
 */
const store = globalThis as typeof globalThis & { __navyLobbies?: Map<string, Lobby> };
const lobbies = (store.__navyLobbies ??= new Map<string, Lobby>());

/** Un salon oublié disparaît au bout d'une heure. */
function evictExpired(now: number) {
  for (const [code, lobby] of lobbies) {
    if (now - lobby.created > HOUR) lobbies.delete(code);
  }
}

export function createLobby(code: string, hostToken: string): Lobby | null {
  const now = Date.now();
  evictExpired(now);
  // Plein malgré le ménage : on refuse plutôt que d'expulser une partie
  // en cours pour faire de la place.
  if (lobbies.size >= MAX_LOBBIES) return null;

  const lobby: Lobby = {
    code,
    created: now,
    hostToken,
    guestToken: null,
    moves: [],
    nextId: 0,
  };
  lobbies.set(code, lobby);
  return lobby;
}

export function getLobby(code: string): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (Date.now() - lobby.created > HOUR) {
    lobbies.delete(code);
    return null;
  }
  return lobby;
}

export function sideOf(lobby: Lobby, token: string): "host" | "guest" | null {
  if (token && token === lobby.hostToken) return "host";
  if (token && token === lobby.guestToken) return "guest";
  return null;
}

export function appendMove(
  lobby: Lobby,
  side: "host" | "guest",
  kind: Move["kind"],
  payload: string,
): Move {
  const move: Move = { id: ++lobby.nextId, side, kind, payload };
  lobby.moves.push(move);
  // Une partie ne dépasse pas la centaine de coups ; au-delà, c'est que
  // quelqu'un s'amuse à remplir la mémoire.
  if (lobby.moves.length > 400) lobby.moves.splice(0, lobby.moves.length - 400);
  return move;
}
