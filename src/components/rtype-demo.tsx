"use client";

import { useState } from "react";
import { Gamepad2, Globe, MonitorSmartphone, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/** Les deux façons de jouer, telles que la page de jeu les comprend. */
const MODES = ["local", "online"] as const;
type Mode = (typeof MODES)[number];

const MODE_ICON = {
  local: MonitorSmartphone,
  online: Globe,
} as const;

/**
 * Démo du client R-Type compilé en WebAssembly.
 *
 * Le jeu vit dans une iframe, et c'est délibéré. Un module Emscripten ne se
 * démonte pas proprement : sa boucle principale tourne dans
 * requestAnimationFrame et ses éléments <video> vivent dans le document.
 * Fermer la fiche retirerait le composant React sans arrêter le jeu ; retirer
 * l'iframe, si.
 *
 * C'est aussi ce qui rend le changement de mode simple : la clé de l'iframe
 * porte le mode, si bien qu'en changer remonte un module neuf — le serveur
 * embarqué et le lien vers le relais s'excluent, ils ne se démontent pas à
 * chaud.
 *
 * Rien n'est chargé avant le clic — le moteur et ses ressources pèsent 13 Mo,
 * ce qui n'a pas à peser sur une page qu'on ne fait que parcourir.
 */
export function RTypeDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("local");

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
              key={mode}
              src={`/rtype/index.html?mode=${mode}`}
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="radiogroup"
          aria-label={t("rtype.mode.label")}
          className="inline-flex items-center rounded-lg border bg-card p-1"
        >
          {MODES.map((value) => {
            const Icon = MODE_ICON[value];
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  selected
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {t(`rtype.mode.${value}`)}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {t(`rtype.mode.${mode}Hint`)}
        </p>
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
