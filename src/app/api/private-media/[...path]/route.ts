/**
 * Sert les médias privés — uniquement en développement.
 *
 * Ces fichiers vivent dans `.media-private/`, hors de `public/`, et ne sont
 * donc jamais téléversés vers Cloudflare. En production la route répond 404
 * sans rien lire : le contenu n'existe pas sur le serveur.
 */

import path from "node:path";

const PRIVATE_ROOT = path.join(process.cwd(), ".media-private");

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
};

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NODE_ENV !== "development") return notFound();

  const { path: segments } = await context.params;
  if (!segments?.length) return notFound();

  // Résolution puis vérification : aucun `..` ne doit permettre de sortir
  // de .media-private/.
  const target = path.resolve(PRIVATE_ROOT, ...segments);
  if (target !== PRIVATE_ROOT && !target.startsWith(PRIVATE_ROOT + path.sep)) {
    return notFound();
  }

  const type = CONTENT_TYPES[path.extname(target).toLowerCase()];
  if (!type) return notFound();

  const { createReadStream } = await import("node:fs");
  const { stat } = await import("node:fs/promises");
  const { Readable } = await import("node:stream");

  const info = await stat(target).catch(() => null);
  if (!info?.isFile()) return notFound();

  const headers = new Headers({
    "content-type": type,
    "accept-ranges": "bytes",
    // Contenu non publié : jamais mis en cache par un intermédiaire.
    "cache-control": "private, no-store",
  });

  // Sans les requêtes Range, impossible de se déplacer dans une vidéo.
  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);

  if (match) {
    const size = info.size;
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${size}` },
      });
    }

    headers.set("content-range", `bytes ${start}-${end}/${size}`);
    headers.set("content-length", String(end - start + 1));

    const stream = Readable.toWeb(
      createReadStream(target, { start, end }),
    ) as unknown as ReadableStream;

    return new Response(stream, { status: 206, headers });
  }

  headers.set("content-length", String(info.size));
  const stream = Readable.toWeb(
    createReadStream(target),
  ) as unknown as ReadableStream;

  return new Response(stream, { status: 200, headers });
}
