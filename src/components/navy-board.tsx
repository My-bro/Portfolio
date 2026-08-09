"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";

/**
 * Une grille de navy, telle que le module la rend.
 *
 * Le C n'expose pas un tableau mais le texte qu'il aurait imprimé : deux
 * lignes d'en-tête, puis huit lignes « 1|. . 2 . … » où chaque case occupe
 * deux caractères. Le relire ici plutôt qu'inventer une structure garde
 * l'affichage collé à ce que le jeu sait vraiment de la partie.
 */
export const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function parseBoard(text: string): string[][] {
  const rows = text.split("\n").slice(2, 10);
  return rows.map((row) => COLUMNS.map((_, i) => row[2 + i * 2] ?? "."));
}

export function NavyBoard({
  cells,
  hideShips = false,
  onFire,
  disabled = false,
  title,
}: {
  cells: string[][];
  hideShips?: boolean;
  onFire?: (coord: string) => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs text-muted-foreground">{title}</p>
      <div className="inline-grid grid-cols-[auto_repeat(8,minmax(0,1fr))] gap-px">
        <span />
        {COLUMNS.map((c) => (
          <span key={c} className="text-center font-mono text-[10px] text-muted-foreground">
            {c}
          </span>
        ))}
        {cells.map((row, y) => (
          <Fragment key={y}>
            <span
              className="pr-1 text-right font-mono text-[10px] leading-none text-muted-foreground self-center"
            >
              {y + 1}
            </span>
            {row.map((cell, x) => {
              const ship = cell >= "2" && cell <= "5";
              const coord = `${COLUMNS[x]}${y + 1}`;
              const shot = cell === "x" || cell === "o";
              return (
                <button
                  key={coord}
                  type="button"
                  aria-label={coord}
                  disabled={disabled || !onFire || shot}
                  onClick={() => onFire?.(coord)}
                  className={cn(
                    "aspect-square w-full min-w-4 rounded-[2px] border border-border/60 text-[10px]",
                    "flex items-center justify-center font-mono leading-none",
                    cell === "x" && "bg-[var(--brand)] text-background",
                    cell === "o" && "bg-muted text-muted-foreground",
                    !shot && ship && !hideShips && "bg-foreground/70",
                    !shot && (!ship || hideShips) && "bg-card",
                    onFire && !shot && !disabled && "hover:bg-[var(--brand)]/30 cursor-pointer",
                  )}
                >
                  {cell === "x" ? "×" : cell === "o" ? "·" : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
