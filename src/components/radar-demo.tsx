"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/**
 * Démo de My radar compilé en WebAssembly.
 *
 * La simulation vit dans une iframe, pour la même raison que R-Type, My
 * Hunter et My RPG : un module Emscripten ne se démonte pas proprement, sa
 * boucle vivant dans requestAnimationFrame. Retirer l'iframe l'arrête net ;
 * démonter le composant React qui la contient ne le ferait pas.
 *
 * Le radar est un rendu CSFML, redirigé ici sur SDL2 par le même shim que
 * My RPG (voir vendor/my-radar/wasm/) : aucune ligne du calcul de vol n'a
 * été réécrite, seule la couche graphique change de destination.
 *
 * Rien n'est chargé avant le clic : le module pèse 2 Mo.
 */
export function RadarDemo() {
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
              src="/radar/index.html"
              title="My radar"
              className="size-full border-0"
              // La simulation tourne sur nos propres fichiers : les scripts
              // suffisent, sans accès au reste de la page.
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("radar.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("radar.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <p className="font-mono text-xs text-muted-foreground">{t("radar.hint")}</p>
      )}
    </div>
  );
}
