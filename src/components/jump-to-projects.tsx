"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { usePrefs } from "@/lib/prefs";

/**
 * Raccourci flottant vers les projets.
 *
 * Les projets sont posés après le parcours, mais ils restent la raison
 * d'être de la page : ce bouton permet d'y sauter à tout moment sans
 * remonter chercher le menu. Il ne s'affiche que dans l'entre-deux — passé
 * le héros, qui a déjà son propre bouton, et jusqu'à ce que les projets
 * arrivent à l'écran, où il n'aurait plus rien à offrir.
 */
export function JumpToProjects() {
  const { t } = usePrefs();
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const projects = document.getElementById("projects");
      if (!projects) return;
      const top = projects.getBoundingClientRect().top;
      // Au-delà d'un écran de défilement, et tant que la section n'a pas
      // atteint le milieu de la fenêtre.
      setVisible(window.scrollY > 320 && top > window.innerHeight * 0.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="#projects"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="group fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full border border-border/60 bg-background/85 py-2.5 pr-3 pl-4 text-sm font-medium shadow-lg backdrop-blur-md transition-colors hover:border-brand hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:right-8 sm:bottom-8"
        >
          {/* Halo qui respire : de quoi attirer l'œil sans clignoter. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-brand/20 opacity-0 blur-md transition-opacity group-hover:opacity-100"
          />
          {t("hero.viewProjects")}
          <motion.span
            aria-hidden
            animate={reduced ? undefined : { y: [0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-6 items-center justify-center rounded-full bg-brand/12 text-brand"
          >
            <ArrowDown className="size-3.5" />
          </motion.span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
