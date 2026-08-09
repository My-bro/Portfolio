"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

export interface TimelineStep {
  /** Année d'études : 1 à 5. */
  tek: number;
  label: string;
  /** Années civiles couvertes par le groupe, pour le sous-titre. */
  years: string;
  count: number;
}

/**
 * Frise des années d'études, collée en haut de la section des projets.
 *
 * Elle sert de repère pendant qu'on descend : la barre se remplit à mesure
 * que la section défile, et l'année en cours s'allume. L'avancement est lu
 * sur le conteneur des projets plutôt que sur la fenêtre — c'est le
 * parcours de la liste qui compte, pas celui de la page.
 */
export function ProjectsTimeline({
  steps,
  target,
  activeTek,
  onSelect,
}: {
  steps: TimelineStep[];
  target: React.RefObject<HTMLElement | null>;
  activeTek: number | null;
  onSelect: (tek: number) => void;
}) {
  const { scrollYProgress } = useScroll({
    target,
    // De l'instant où la liste touche le bas de l'écran à celui où son bas
    // le quitte : la barre est pleine quand le dernier projet est passé.
    offset: ["start 0.75", "end 0.35"],
  });

  // Un ressort évite que la barre saute à chaque cran de molette.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });
  const width = useTransform(progress, (value) => `${Math.min(1, Math.max(0, value)) * 100}%`);

  return (
    <div
      data-projects-timeline
      className="sticky top-16 z-20 -mx-2 mb-6 rounded-lg border bg-background/85 px-3 py-2 backdrop-blur-sm"
    >
      <div className="relative h-0.5 w-full rounded-full bg-border">
        <motion.div
          aria-hidden
          style={{ width }}
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
        />
      </div>

      <div className="mt-2 flex items-end justify-between gap-1">
        {steps.map((step) => {
          const active = step.tek === activeTek;
          return (
            <button
              key={step.tek}
              type="button"
              onClick={() => onSelect(step.tek)}
              className={cn(
                "group flex min-w-0 flex-col items-start rounded px-1 py-0.5 text-left transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-mono text-xs whitespace-nowrap">{step.label}</span>
              <span className="font-mono text-[10px] whitespace-nowrap opacity-70">
                {step.years}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Le groupe visible : le dernier dont le titre est passé sous la frise.
 * Un IntersectionObserver suffirait pour savoir « est-ce à l'écran », mais
 * pas pour départager deux groupes visibles à la fois.
 */
export function useActiveTek(tekList: number[]): number | null {
  const [active, setActive] = useState<number | null>(null);
  // Le tableau change d'identité à chaque rendu ; sa forme, non. C'est
  // elle qui décide de réinstaller l'écouteur.
  const key = tekList.join(",");

  useEffect(() => {
    const list = key === "" ? [] : key.split(",").map(Number);
    const onScroll = () => {
      // Un groupe devient courant quand son titre passe au-dessus du
      // milieu de l'écran : c'est là qu'il occupe vraiment la vue. Plus
      // haut, on basculerait sur le suivant alors qu'on lit encore le
      // précédent ; collé à la frise, l'inverse.
      const threshold = window.innerHeight * 0.45;

      let current: number | null = list[0] ?? null;
      for (const tek of list) {
        const element = document.getElementById(`tek-${tek}`);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= threshold) current = tek;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key]);

  return active ?? tekList[0] ?? null;
}
