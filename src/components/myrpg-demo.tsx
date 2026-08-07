"use client";

import { useState } from "react";
import { Gamepad2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/**
 * Démo de My RPG compilé en WebAssembly.
 *
 * Le jeu vit dans une iframe, pour la même raison que R-Type et My Hunter :
 * un module Emscripten ne se démonte pas proprement, sa boucle vivant dans
 * requestAnimationFrame. Retirer l'iframe l'arrête net ; démonter le
 * composant React qui la contient ne le ferait pas.
 *
 * La fenêtre de jeu native est en 1920×1080 — grand écran, pas carré comme
 * My Hunter.
 *
 * Rien n'est chargé avant le clic : le module et ses ressources pèsent
 * 11 Mo, ce qui n'a pas à peser sur une page qu'on ne fait que parcourir.
 */
export function MyRpgDemo() {
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
              src="/myrpg/index.html"
              title="My RPG"
              className="size-full border-0"
              // Le jeu tourne sur nos propres fichiers : scripts et audio
              // suffisent, sans accès au reste de la page.
              sandbox="allow-scripts allow-same-origin"
              allow="autoplay"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("myrpg.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("myrpg.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gamepad2 className="size-3.5" />
            {t("myrpg.controls")}
          </span>
          <span>{t("myrpg.hint")}</span>
        </p>
      )}
    </div>
  );
}
