"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Gamepad2,
  Globe,
  MonitorSmartphone,
  Play,
} from "lucide-react";

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
 * Les touches du jeu, telles que configuration_files/inputs.ini les nomme.
 *
 * C'est bien le caractère produit qui compte, et non l'emplacement de la
 * touche : le module lit `KeyboardEvent.key` pour suivre la disposition du
 * clavier plutôt que la position physique. Un « z » d'ici vaut donc exactement
 * un « z » tapé sur un AZERTY.
 */
const PAD = [
  { key: "z", label: "rtype.pad.up", Icon: ArrowUp },
  { key: "q", label: "rtype.pad.left", Icon: ArrowLeft },
  { key: "s", label: "rtype.pad.down", Icon: ArrowDown },
  { key: "d", label: "rtype.pad.right", Icon: ArrowRight },
  { key: " ", label: "rtype.pad.shoot", Icon: Crosshair },
] as const;

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
  const frame = useRef<HTMLIFrameElement>(null);

  /**
   * Envoie une touche au jeu, qui vit dans l'iframe.
   *
   * L'iframe est de même origine — c'est ce que `allow-same-origin` autorise
   * —, on peut donc écrire dans son document. Le module écoute sur `window`
   * en phase de capture : viser sa fenêtre suffit.
   */
  const sendKey = useCallback((key: string, down: boolean) => {
    const view = frame.current?.contentWindow;
    if (!view) return;
    // Le constructeur de l'iframe, et non celui de la page : un évènement
    // fabriqué ici serait rejeté par le document d'en face, qui n'en
    // reconnaîtrait pas le type.
    const KeyboardEventCtor = (view as unknown as { KeyboardEvent: typeof KeyboardEvent })
      .KeyboardEvent;
    view.dispatchEvent(
      new KeyboardEventCtor(down ? "keydown" : "keyup", { key, bubbles: true }),
    );
  }, []);

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
              ref={frame}
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
        <>
          {/* Manette d'appoint : le jeu se joue au clavier, que les écrans
              tactiles n'ont pas. Les boutons se maintiennent — le vaisseau
              avance tant que le doigt reste posé —, d'où pointerdown/up
              plutôt qu'un simple clic. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              {t("rtype.pad.label")}
            </span>
            <div className="flex gap-1">
              {PAD.map(({ key, label, Icon }) => (
                <Button
                  key={key}
                  variant="outline"
                  size="icon"
                  aria-label={t(label)}
                  className="touch-none select-none"
                  onPointerDown={(event) => {
                    // Le bouton garde le pointeur : sans cela, un doigt qui
                    // glisse hors de la cible n'enverrait jamais son relâchement
                    // et la touche resterait enfoncée.
                    event.currentTarget.setPointerCapture(event.pointerId);
                    sendKey(key, true);
                  }}
                  onPointerUp={() => sendKey(key, false)}
                  onPointerCancel={() => sendKey(key, false)}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <Icon className="size-4" />
                </Button>
              ))}
            </div>
          </div>

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Gamepad2 className="size-3.5" />
              {t("rtype.controls")}
            </span>
            <span>{t("rtype.hint")}</span>
          </p>
        </>
      )}
    </div>
  );
}
