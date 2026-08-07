"use client";

import { useState } from "react";
import { MousePointerClick, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/**
 * Démo de My Hunter compilé en WebAssembly.
 *
 * Le jeu vit dans une iframe, pour la même raison que R-Type : un module
 * Emscripten ne se démonte pas proprement, sa boucle vivant dans
 * requestAnimationFrame. Retirer l'iframe l'arrête net ; démonter le
 * composant React qui la contient ne le ferait pas.
 *
 * Plus simple que R-Type : un seul joueur, pas de mode à choisir, et la
 * seule commande est le clic — donc pas de manette d'appoint à dessiner
 * pour les écrans tactiles, un tapotement fait déjà l'affaire.
 *
 * Rien n'est chargé avant le clic : le module et ses ressources pèsent
 * 13 Mo, ce qui n'a pas à peser sur une page qu'on ne fait que parcourir.
 */
export function MyHunterDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-lg border bg-black",
          "max-w-[min(100%,68vh)]",
        )}
      >
        <div className="aspect-square w-full">
          {started ? (
            <iframe
              src="/myhunter/index.html"
              title="My Hunter"
              className="size-full border-0"
              // Le jeu tourne sur nos propres fichiers : scripts et audio
              // suffisent, sans accès au reste de la page.
              sandbox="allow-scripts allow-same-origin"
              allow="autoplay"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("myhunter.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("myhunter.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MousePointerClick className="size-3.5" />
            {t("myhunter.controls")}
          </span>
          <span>{t("myhunter.hint")}</span>
        </p>
      )}
    </div>
  );
}
