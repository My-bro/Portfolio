"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const CHAR_MS = 62;
/** Léger désordre dans la cadence : une frappe parfaitement régulière sonne faux. */
const JITTER_MS = 26;
const START_DELAY_MS = 220;

/**
 * Écrit le nom caractère par caractère, puis laisse un curseur clignoter.
 *
 * Le nom complet est rendu une seconde fois, invisible, dans la même cellule
 * de grille : il réserve la place définitive dès le premier rendu, donc le
 * texte qui suit ne bouge jamais pendant la frappe.
 */
export function TypedName({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Qui refuse les animations voit le nom entier d'emblée.
  const count = reduced ? text.length : typed;
  const done = count >= text.length;

  useEffect(() => {
    if (reduced) return;

    let index = 0;
    const step = () => {
      index += 1;
      setTyped(index);
      if (index < text.length) {
        timer.current = setTimeout(step, CHAR_MS + Math.random() * JITTER_MS);
      }
    };

    timer.current = setTimeout(step, START_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, reduced]);

  return (
    <span className={cn("grid", className)} aria-label={text}>
      <span
        aria-hidden
        className="col-start-1 row-start-1 invisible select-none"
      >
        {text}
      </span>
      <span aria-hidden className="col-start-1 row-start-1">
        {text.slice(0, count)}
        <span
          className={cn(
            "caret",
            // Curseur plein pendant la frappe, clignotant une fois le nom écrit.
            !done && "[animation:none]",
          )}
        />
      </span>
    </span>
  );
}
