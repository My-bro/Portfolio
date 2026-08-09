import { appendMove, getLobby, sideOf } from "@/lib/navy-lobbies";

/**
 * Une partie en ligne de My navy : relevé de l'état, et dépôt d'un coup.
 *
 * Le tour par tour se contente d'une scrutation : chaque camp redemande
 * les messages qu'il n'a pas encore vus. Pas de WebSocket, donc pas de
 * connexion à tenir ouverte, et pas de stockage — les salons vivent en
 * mémoire (src/lib/navy-lobbies.ts).
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") ?? 0) || 0;

  const lobby = getLobby(code.toUpperCase());
  if (!lobby) return json({ error: "unknown-code" }, 404);
  // Le camp est déduit du jeton, jamais de ce que le client annonce.
  const side = sideOf(lobby, url.searchParams.get("token") ?? "");
  if (!side) return json({ error: "forbidden" }, 403);

  return json({
    side,
    // La flotte adverse ne transite jamais : chaque navigateur ne connaît
    // que la sienne, et découvre l'autre coup par coup.
    opponentJoined: lobby.guestToken !== null,
    moves: lobby.moves.filter((move) => move.id > since),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "bad-request" }, 400);
  }

  const lobby = getLobby(code.toUpperCase());
  if (!lobby) return json({ error: "unknown-code" }, 404);
  const side = sideOf(lobby, String(body.token ?? ""));
  if (!side) return json({ error: "forbidden" }, 403);

  // Une salve fait vingt signaux, une réponse est l'un des trois mots du
  // jeu : tout le reste est refusé plutôt que relayé.
  const kind = body.kind;
  const payload = String(body.payload ?? "");
  const validFire = kind === "fire" && /^[12]{20}$/.test(payload);
  const validAnswer = kind === "answer" && ["hit", "miss", "sunk"].includes(payload);
  if (!validFire && !validAnswer) return json({ error: "bad-move" }, 400);

  const move = appendMove(lobby, side, kind as "fire" | "answer", payload);
  return json({ id: move.id });
}
