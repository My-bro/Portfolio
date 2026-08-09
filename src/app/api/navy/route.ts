import { createLobby, getLobby } from "@/lib/navy-lobbies";

/**
 * Salons de My navy : création et arrivée d'un adversaire.
 *
 * Il n'y a pas de serveur de jeu — le site relaie, c'est tout. Le jeu
 * lui-même tourne en WebAssembly dans les deux navigateurs, chacun avec sa
 * propre grille ; ce qui transite ici est la salve de signaux qu'un
 * processus aurait envoyée à l'autre (voir vendor/my-navy/lib_navy/
 * signal_str.c) et la réponse touché / manqué.
 *
 * Rien n'est écrit nulle part : les salons vivent en mémoire, une heure au
 * plus, cinquante au maximum (voir src/lib/navy-lobbies.ts).
 */

/** Sans I ni O ni 0 ni 1 : le code se dicte à voix haute. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function shortCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Format des fichiers pos*.txt : quatre lignes « taille:début:fin ». */
function validLayout(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  const lines = value.trim().split("\n");
  if (lines.length !== 4) return false;
  return lines.every((line) => /^[2-5]:[A-H][1-8]:[A-H][1-8]$/.test(line.trim()));
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "bad-request" }, 400);
  }

  // La flotte n'est pas gardée ici : chaque navigateur connaît la sienne et
  // ne montre à l'autre que le résultat de ses tirs. Elle est tout de même
  // validée, pour ne pas ouvrir un salon sur une partie ingérable.
  if (!validLayout(body.layout)) return json({ error: "bad-layout" }, 400);

  if (body.action === "create") {
    const token = crypto.randomUUID();
    const lobby = createLobby(shortCode(), token);
    if (!lobby) return json({ error: "too-many-lobbies" }, 503);
    return json({ code: lobby.code, side: "host", token });
  }

  if (body.action === "join") {
    const code = String(body.code ?? "").toUpperCase();
    if (!/^[A-Z2-9]{5}$/.test(code)) return json({ error: "bad-code" }, 400);

    const lobby = getLobby(code);
    if (!lobby) return json({ error: "unknown-code" }, 404);
    if (lobby.guestToken) return json({ error: "lobby-full" }, 409);

    lobby.guestToken = crypto.randomUUID();
    return json({ code, side: "guest", token: lobby.guestToken });
  }

  return json({ error: "bad-request" }, 400);
}
