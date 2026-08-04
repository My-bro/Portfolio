import "server-only";

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Accès à D1 tolérant à son absence.
 *
 * Tant que la base n'a pas été créée (`wrangler d1 create`), ou en `next dev`
 * sans binding, tout doit continuer à fonctionner : les metrics sont un
 * confort, pas une dépendance du site.
 */

export interface MetricsEnv {
  DB?: D1Database;
  METRICS_KEY?: string;
}

export async function getEnv(): Promise<MetricsEnv> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return env as unknown as MetricsEnv;
  } catch {
    return {};
  }
}

export async function getDb(): Promise<D1Database | null> {
  const env = await getEnv();
  return env.DB ?? null;
}

export async function getMetricsKey(): Promise<string | undefined> {
  const env = await getEnv();
  return env.METRICS_KEY ?? process.env.METRICS_KEY;
}
