"use client";

/**
 * Un camp de navy : son worker, et l'attente de sa réponse.
 *
 * Le module ne rend jamais deux messages pour un seul : la partie est
 * strictement séquentielle (on tire, l'autre répond, on encaisse). Une
 * simple promesse par message suffit donc, sans file d'attente.
 */

export interface NavySide {
  ask: (message: Record<string, unknown>) => Promise<NavyReply>;
  close: () => void;
}

export interface NavyReply {
  type: string;
  coord?: string;
  train?: string;
  answer?: "hit" | "miss" | "sunk";
  won?: boolean;
  own?: string;
  enemy?: string;
  code?: number;
  message?: string;
}

export function openSide(): NavySide {
  const worker = new Worker("/navy/navy-worker.js", { type: "module" });
  let pending: ((reply: NavyReply) => void) | null = null;

  worker.onmessage = (event) => {
    const resolve = pending;
    pending = null;
    resolve?.(event.data as NavyReply);
  };

  return {
    ask: (message) =>
      new Promise<NavyReply>((resolve) => {
        pending = resolve;
        worker.postMessage(message);
      }),
    close: () => worker.terminate(),
  };
}

export const LAYOUTS = ["pos1", "pos2", "pos3", "pos4"] as const;

export async function loadLayout(name: string): Promise<string> {
  return fetch(`/navy/${name}.txt`).then((r) => r.text());
}
