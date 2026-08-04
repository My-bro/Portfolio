import "server-only";

import { cookies } from "next/headers";
import { getMetricsKey } from "@/lib/d1";

export const AUTH_COOKIE = "metrics_auth";

/** Le cookie ne contient qu'une empreinte : la clé elle-même n'y figure pas. */
export async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(`portfolio-metrics:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison à durée constante, pour ne rien apprendre au tâtonnement. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAuthorised(): Promise<boolean> {
  const expected = await getMetricsKey();

  // En développement sans clé configurée, l'accès est libre : la base est
  // locale et vide de toute façon.
  if (!expected) return process.env.NODE_ENV !== "production";

  const cookie = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!cookie) return false;
  return timingSafeEqual(cookie, await hashKey(expected));
}
