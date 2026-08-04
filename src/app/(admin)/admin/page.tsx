import { getDb, getMetricsKey } from "@/lib/d1";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { isAuthorised } from "./auth";
import { signIn, signOut } from "./actions";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90, 0] as const;

const NAMES = new Map<string, string>([
  ...projects.map((p) => [p.slug, p.name] as const),
  ...experience.map((e) => [e.id, e.org || e.title.fr] as const),
  ...education.map((e) => [e.id, e.org || e.title.fr] as const),
]);

interface Row {
  slug: string | null;
  opens: number;
  avg_rank: number | null;
  last_ts: number | null;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; n: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="space-y-2.5 rounded-lg border bg-card p-4">
      <h3 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span>{row.label}</span>
                <span className="text-muted-foreground">{row.n}</span>
              </div>
              <Bar value={row.n} max={max} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; error?: string }>;
}) {
  const { days: daysParam, error } = await searchParams;

  if (!(await isAuthorised())) {
    const configured = Boolean(await getMetricsKey());
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6">
        <h1 className="font-mono text-lg">Metrics</h1>
        {configured ? (
          <form action={signIn} className="space-y-3">
            <input
              type="password"
              name="key"
              autoFocus
              placeholder="METRICS_KEY"
              className="w-full rounded-md border bg-card px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {error && (
              <p className="text-sm text-destructive">Clé incorrecte.</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Entrer
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune clé configurée. Définis-en une avec{" "}
            <code className="font-mono text-brand">
              npx wrangler secret put METRICS_KEY
            </code>
            .
          </p>
        )}
      </main>
    );
  }

  const days = RANGES.includes(Number(daysParam) as (typeof RANGES)[number])
    ? Number(daysParam)
    : 30;
  const since = days === 0 ? 0 : Date.now() - days * 86_400_000;

  const db = await getDb();

  if (!db) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-mono text-lg">Metrics</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Base D1 non liée. Crée-la puis applique la migration :
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border bg-card p-4 font-mono text-xs">
          {`npx wrangler d1 create portfolio-metrics\nnpm run db:migrate`}
        </pre>
      </main>
    );
  }

  let visits = 0;
  let rows: Row[] = [];
  let firstOpens: { slug: string; n: number }[] = [];
  let byProfile: { label: string; n: number }[] = [];
  let byLang: { label: string; n: number }[] = [];
  let byCountry: { label: string; n: number }[] = [];
  let byReferrer: { label: string; n: number }[] = [];
  let failure: string | null = null;

  try {
    const [v, p, f, pr, lg, co, rf] = await db.batch([
      db
        .prepare(`SELECT COUNT(*) AS n FROM events WHERE kind='visit' AND ts > ?`)
        .bind(since),
      db
        .prepare(
          `SELECT slug, COUNT(*) AS opens, AVG(rank) AS avg_rank, MAX(ts) AS last_ts
           FROM events WHERE kind='project' AND ts > ?
           GROUP BY slug ORDER BY opens DESC`,
        )
        .bind(since),
      db
        .prepare(
          `SELECT slug, COUNT(*) AS n FROM events
           WHERE kind='project' AND rank = 1 AND ts > ?
           GROUP BY slug ORDER BY n DESC`,
        )
        .bind(since),
      db
        .prepare(
          `SELECT profile AS label, COUNT(*) AS n FROM events
           WHERE kind='project' AND profile IS NOT NULL AND ts > ?
           GROUP BY profile ORDER BY n DESC`,
        )
        .bind(since),
      db
        .prepare(
          `SELECT lang AS label, COUNT(*) AS n FROM events WHERE ts > ?
           GROUP BY lang ORDER BY n DESC`,
        )
        .bind(since),
      db
        .prepare(
          `SELECT country AS label, COUNT(*) AS n FROM events
           WHERE country IS NOT NULL AND ts > ?
           GROUP BY country ORDER BY n DESC LIMIT 8`,
        )
        .bind(since),
      db
        .prepare(
          `SELECT referrer AS label, COUNT(*) AS n FROM events
           WHERE referrer IS NOT NULL AND ts > ?
           GROUP BY referrer ORDER BY n DESC LIMIT 8`,
        )
        .bind(since),
    ]);

    visits = (v.results as { n: number }[])[0]?.n ?? 0;
    rows = p.results as unknown as Row[];
    firstOpens = f.results as unknown as { slug: string; n: number }[];
    byProfile = pr.results as unknown as { label: string; n: number }[];
    byLang = lg.results as unknown as { label: string; n: number }[];
    byCountry = co.results as unknown as { label: string; n: number }[];
    byReferrer = rf.results as unknown as { label: string; n: number }[];
  } catch (err) {
    failure = err instanceof Error ? err.message : String(err);
  }

  const totalOpens = rows.reduce((sum, r) => sum + r.opens, 0);
  const maxOpens = Math.max(1, ...rows.map((r) => r.opens));
  const firstByslug = new Map(firstOpens.map((f) => [f.slug, f.n]));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg">Metrics</h1>
          <p className="text-sm text-muted-foreground">
            Aucune donnée personnelle collectée.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex gap-1 rounded-lg border bg-card p-1">
            {RANGES.map((r) => (
              <a
                key={r}
                href={`/admin?days=${r}`}
                className={`rounded-md px-2.5 py-1 font-mono text-xs ${
                  r === days
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === 0 ? "tout" : `${r}j`}
              </a>
            ))}
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              sortir
            </button>
          </form>
        </div>
      </header>

      {failure && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">Requête impossible</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{failure}</p>
          <p className="mt-2 text-muted-foreground">
            La migration a-t-elle été appliquée ? <code>npm run db:migrate</code>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Visites" value={visits} />
        <Stat label="Projets ouverts" value={totalOpens} />
        <Stat
          label="Ouvertures / visite"
          value={visits > 0 ? (totalOpens / visits).toFixed(2) : "—"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Projets par intérêt
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Aucune ouverture sur la période.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b font-mono text-xs text-muted-foreground">
                  <th className="p-3 text-left font-normal">Projet</th>
                  <th className="p-3 text-right font-normal">Ouvertures</th>
                  <th className="p-3 text-right font-normal" title="Ouvert en premier">
                    1ᵉʳ
                  </th>
                  <th
                    className="p-3 text-right font-normal"
                    title="Rang moyen d'ouverture dans la visite"
                  >
                    Rang moy.
                  </th>
                  <th className="p-3 text-left font-normal">Part</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug} className="border-b last:border-0">
                    <td className="p-3 font-medium">
                      {NAMES.get(row.slug ?? "") ?? row.slug}
                    </td>
                    <td className="p-3 text-right font-mono">{row.opens}</td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {firstByslug.get(row.slug ?? "") ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {row.avg_rank ? row.avg_rank.toFixed(1) : "—"}
                    </td>
                    <td className="w-40 p-3">
                      <Bar value={row.opens} max={maxOpens} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          « 1ᵉʳ » compte les visites où ce projet a été le premier ouvert, et
          « rang moyen » sa position habituelle dans le parcours : plus il est
          bas, plus le projet attire d&apos;emblée.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Breakdown
          title="Profil"
          rows={byProfile.map((r) => ({
            label: r.label === "cpp" ? "C / C++" : "Web",
            n: r.n,
          }))}
        />
        <Breakdown
          title="Langue"
          rows={byLang.map((r) => ({ label: r.label.toUpperCase(), n: r.n }))}
        />
        <Breakdown title="Pays" rows={byCountry} />
        <Breakdown title="Provenance" rows={byReferrer} />
      </div>
    </main>
  );
}
