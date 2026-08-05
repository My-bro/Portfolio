"use client";

import { useState } from "react";
import { Gamepad2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/**
 * Démo du client R-Type compilé en WebAssembly.
 *
 * Le jeu vit dans une iframe, et c'est délibéré. Un module Emscripten ne se
 * démonte pas proprement : sa boucle principale tourne dans
 * requestAnimationFrame et ses éléments <video> vivent dans le document.
 * Fermer la fiche retirerait le composant React sans arrêter le jeu ; retirer
 * l'iframe, si.
 *
 * Rien n'est chargé avant le clic — le moteur et ses ressources pèsent 13 Mo,
 * ce qui n'a pas à peser sur une page qu'on ne fait que parcourir.
 */
export function RTypeDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-lg border bg-black",
          "max-w-[min(100%,calc(68vh*16/9))]",
        )}
      >
        <div className="aspect-video w-full">
          {started ? (
            <iframe
              src="/rtype/index.html"
              title="R-Type"
              className="size-full border-0"
              // Le jeu tourne sur nos propres fichiers : scripts et audio
              // suffisent, sans accès au reste de la page.
              sandbox="allow-scripts allow-same-origin"
              allow="autoplay; fullscreen"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("rtype.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("rtype.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gamepad2 className="size-3.5" />
            {t("rtype.controls")}
          </span>
          <span>{t("rtype.hint")}</span>
        </p>
      )}
    </div>
  );
}
