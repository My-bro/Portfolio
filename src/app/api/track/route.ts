import { getDb } from "@/lib/d1";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { LANGS, PROFILES } from "@/content/types";

/**
 * Réception des évènements d'audience.
 *
 * Rien d'identifiant n'est conservé : pas d'IP, pas de cookie, pas
 * d'empreinte. Le pays vient de l'en-tête que Cloudflare ajoute en bordure,
 * et le référent est réduit à son nom de domaine.
 */

const KNOWN_SLUGS = new Set<string>([
  ...projects.map((p) => p.slug),
  ...experience.map((e) => e.id),
  ...education.map((e) => e.id),
]);

const ok = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return new Response("Bad request", { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const kind = raw.kind;
  if (kind !== "visit" && kind !== "project") {
    return new Response("Bad request", { status: 400 });
  }

  const lang = (LANGS as readonly string[]).includes(String(raw.lang))
    ? String(raw.lang)
    : null;
  if (!lang) return new Response("Bad request", { status: 400 });

  const slug =
    kind === "project" && KNOWN_SLUGS.has(String(raw.slug))
      ? String(raw.slug)
      : null;
  if (kind === "project" && !slug) return new Response("Bad request", { status: 400 });

  const profile = (PROFILES as readonly string[]).includes(String(raw.profile))
    ? String(raw.profile)
    : null;

  const rankValue = Number(raw.rank);
  const rank =
    Number.isInteger(rankValue) && rankValue > 0 && rankValue <= 50
      ? rankValue
      : null;

  // Le référent est tronqué à son domaine : d'où vient la visite suffit,
  // l'URL complète serait une donnée de trop.
  let referrer: string | null = null;
  if (typeof raw.referrer === "string" && raw.referrer.length < 500) {
    try {
      referrer = new URL(raw.referrer).hostname || null;
    } catch {
      referrer = null;
    }
  }

  const country = request.headers.get("cf-ipcountry");

  const db = await getDb();
  if (!db) return ok(); // Pas de base configurée : on ignore silencieusement.

  try {
    await db
      .prepare(
        `INSERT INTO events (ts, kind, slug, profile, lang, rank, country, referrer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        Date.now(),
        kind,
        slug,
        profile,
        lang,
        rank,
        country && country !== "XX" ? country : null,
        referrer,
      )
      .run();
  } catch {
    // Table absente ou base indisponible : la page ne doit rien en savoir.
  }

  return ok();
}
