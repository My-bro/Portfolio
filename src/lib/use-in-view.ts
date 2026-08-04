"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Signale qu'un élément approche du viewport.
 *
 * Sert à ne monter les <video> que là où elles peuvent être vues : sur une
 * page qui en contient une dizaine, c'est ce qui évite autant de connexions
 * et de décodeurs ouverts en même temps.
 */
export function useInView<T extends Element>({
  rootMargin = "200px",
  threshold = 0,
  once = false,
}: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
} = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}

type Connection = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getConnection(): Connection | undefined {
  return (navigator as Navigator & { connection?: Connection }).connection;
}

function subscribeConnection(onChange: () => void) {
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);
  return () => connection?.removeEventListener?.("change", onChange);
}

function readSavesData(): boolean {
  const connection = getConnection();
  if (!connection) return false;
  return (
    connection.saveData === true ||
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g"
  );
}

/**
 * Vrai quand l'utilisateur a demandé à économiser la donnée, ou que la
 * connexion est lente. On s'abstient alors de précharger les aperçus vidéo.
 */
export function useSavesData(): boolean {
  return useSyncExternalStore(subscribeConnection, readSavesData, () => false);
}
