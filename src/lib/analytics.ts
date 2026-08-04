"use client";

import type { Lang, Profile } from "@/content/types";

/**
 * Mesure d'audience minimale : aucun cookie, aucune adresse IP, aucun
 * identifiant persistant. On enregistre seulement quel projet a été ouvert,
 * et dans quel ordre — c'est ce qui dit lesquels intéressent en priorité.
 */

const ENDPOINT = "/api/track";
const SESSION_KEY = "portfolio.seen";

type Kind = "visit" | "project";

interface Payload {
  kind: Kind;
  slug?: string;
  profile?: Profile;
  lang: Lang;
  /** Rang d'ouverture dans la visite : 1 = premier projet consulté. */
  rank?: number;
  referrer?: string;
}

function send(payload: Payload) {
  try {
    const body = JSON.stringify(payload);

    // sendBeacon survit à la fermeture de l'onglet et ne bloque rien.
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
      return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // La mesure ne doit jamais casser la page.
  }
}

function seenThisSession(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function remember(slug: string, seen: string[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen, slug]));
  } catch {
    // sessionStorage indisponible : le rang sera simplement toujours 1.
  }
}

export function trackVisit(lang: Lang) {
  const seen = seenThisSession();
  if (seen.length > 0) return; // Déjà compté pour cette visite.

  send({
    kind: "visit",
    lang,
    referrer: document.referrer || undefined,
  });
  remember("", seen);
}

export function trackProjectOpen(slug: string, profile: Profile, lang: Lang) {
  const seen = seenThisSession();
  if (seen.includes(slug)) return; // Un projet ne compte qu'une fois par visite.

  const rank = seen.filter(Boolean).length + 1;
  send({ kind: "project", slug, profile, lang, rank });
  remember(slug, seen);
}
