"use client";

import { useSyncExternalStore } from "react";

/**
 * Palette des démos dessinées sur <canvas>.
 *
 * Un canevas ne reçoit pas les classes Tailwind : il lui faut des couleurs
 * concrètes. Plutôt que de figer des hexadécimaux à côté du thème — ce que
 * faisaient les démos jusqu'ici, avec un bleu et un vert absents du reste du
 * site — on lit les variables `--demo-*` de globals.css, qui suivent le
 * basculement clair/sombre comme n'importe quelle autre couleur du site.
 */
const TOKENS = [
  "surface",
  "free",
  "wall",
  "grid",
  "visited",
  "path",
  "start",
  "end",
] as const;

export type DemoPalette = Record<(typeof TOKENS)[number], string>;

const FALLBACK: DemoPalette = {
  surface: "#191c1e",
  free: "#4e5256",
  wall: "#23272a",
  grid: "#131517",
  visited: "#6b7075",
  path: "#c4c6c8",
  start: "#e4e6e8",
  end: "#969a9e",
};

function read(): DemoPalette {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const palette = {} as DemoPalette;
  for (const token of TOKENS) {
    palette[token] = styles.getPropertyValue(`--demo-${token}`).trim() || FALLBACK[token];
  }
  return palette;
}

/**
 * `next-themes` bascule une classe sur <html> : on s'y abonne plutôt que de
 * dupliquer son état, et on recalcule la palette à ce moment-là (la lecture
 * ne coûte qu'un getComputedStyle, seulement au changement de thème).
 */
let cache: DemoPalette | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) {
    observer = new MutationObserver(() => {
      cache = null;
      for (const listener of listeners) listener();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

let observer: MutationObserver | null = null;

function getSnapshot(): DemoPalette {
  cache ??= read();
  return cache;
}

function getServerSnapshot(): DemoPalette {
  return FALLBACK;
}

export function useDemoPalette(): DemoPalette {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
