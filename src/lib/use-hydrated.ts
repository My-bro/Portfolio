"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Faux pendant le rendu serveur, vrai une fois côté client.
 *
 * Permet de n'utiliser une valeur connue du seul navigateur (thème résolu,
 * profil choisi) qu'après hydratation, sans provoquer d'écart entre le HTML
 * envoyé et le premier rendu React.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
