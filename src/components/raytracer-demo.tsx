"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/content/i18n";

/**
 * Démo du raytracer C++ compilé en WebAssembly.
 *
 * Rien n'est chargé au montage : ni le worker, ni les 260 Ko de moteur. Le
 * téléchargement ne part qu'au clic sur « Lancer le rendu », pour qu'une
 * fiche projet reste aussi légère que les autres tant qu'on ne demande rien.
 *
 * Le calcul vit dans un worker et l'image remonte par tranches de lignes :
 * la page ne se fige jamais, et on voit le rendu se construire.
 */

const SCENES: { file: string; label: string }[] = [
  { file: "example.cfg", label: "Sphères & cylindres" },
  { file: "epitech.cfg", label: "Epitech" },
  { file: "color_fade_1.cfg", label: "Dégradé" },
  { file: "spot_light.cfg", label: "Spot" },
];

const QUALITIES: { width: number; key: TranslationKey }[] = [
  { width: 240, key: "rt.qualityFast" },
  { width: 400, key: "rt.qualityNormal" },
  { width: 640, key: "rt.qualityFine" },
];

/** Pas repris de la version SFML : 0,1 sur le plan écran, qui vaut 10 % de sa largeur. */
const PAN_STEP = 0.1;
/** La profondeur se compte en unités de scène, d'où un pas bien plus grand. */
const DOLLY_STEP = 100;

type Status = "idle" | "loading" | "rendering" | "ready" | "error";

interface RenderInfo {
  width: number;
  height: number;
  primitives: number;
  ms: number | null;
}

export function RaytracerDemo() {
  const { t } = usePrefs();

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scene, setScene] = useState(SCENES[0].file);
  const [quality, setQuality] = useState(1);
  const [info, setInfo] = useState<RenderInfo | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const paint = useCallback(
    (
      y0: number,
      width: number,
      height: number,
      // Le worker transfère un tampon détaché de la mémoire WASM, donc bien
      // un ArrayBuffer et non un SharedArrayBuffer.
      pixels: Uint8ClampedArray<ArrayBuffer>,
    ) => {
      const context = canvasRef.current?.getContext("2d");
      if (!context) return;
      context.putImageData(new ImageData(pixels, width, height), 0, y0);
    },
    [],
  );

  /** Crée le worker au premier usage et attend qu'il ait chargé le module. */
  const ensureWorker = useCallback(async (): Promise<Worker | null> => {
    if (workerRef.current) return workerRef.current;

    if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
      setStatus("error");
      setError(t("rt.unsupported"));
      return null;
    }

    const worker = new Worker("/wasm/raytracer-worker.js", { type: "module" });

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "start") {
        sizeRef.current = { width: message.width, height: message.height };
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = message.width;
          canvas.height = message.height;
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, message.width, message.height);
        }
        setInfo({
          width: message.width,
          height: message.height,
          primitives: message.primitives,
          ms: null,
        });
        setStatus("rendering");
        return;
      }

      if (message.type === "rows") {
        paint(message.y0, message.width, message.y1 - message.y0, message.pixels);
        return;
      }

      if (message.type === "done") {
        setInfo((current) => (current ? { ...current, ms: message.ms } : current));
        setStatus("ready");
        return;
      }

      if (message.type === "error") {
        setError(message.message);
        setStatus("error");
      }
    };

    worker.onerror = (event) => {
      setError(event.message || t("rt.error"));
      setStatus("error");
    };

    workerRef.current = worker;

    await new Promise<void>((resolve) => {
      const onReady = (event: MessageEvent) => {
        if (event.data?.type === "ready") {
          worker.removeEventListener("message", onReady);
          resolve();
        }
      };
      worker.addEventListener("message", onReady);
      worker.postMessage({ type: "init" });
    });

    return worker;
  }, [paint, t]);

  const render = useCallback(
    async (file: string, qualityIndex: number) => {
      setError(null);
      setStatus((current) => (current === "idle" ? "loading" : current));

      const worker = await ensureWorker();
      if (!worker) return;

      setStatus("rendering");
      worker.postMessage({
        type: "render",
        scene: `/scenes/${file}`,
        width: QUALITIES[qualityIndex].width,
        // Les scènes sont carrées ; le moteur renverra sa vraie définition
        // dans le message « start », donc le canvas s'y ajustera.
        height: QUALITIES[qualityIndex].width,
      });
    },
    [ensureWorker],
  );

  const nudge = useCallback((dx: number, dy: number, dz: number) => {
    const worker = workerRef.current;
    if (!worker) return;
    setStatus("rendering");
    worker.postMessage({
      type: "move",
      dx,
      dy,
      dz,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
    });
  }, []);

  const recenter = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    setStatus("rendering");
    worker.postMessage({
      type: "reset",
      width: sizeRef.current.width,
      height: sizeRef.current.height,
    });
  }, []);

  const started = status !== "idle" && status !== "loading";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border bg-black">
        <div className="aspect-square w-full">
          <canvas
            ref={canvasRef}
            className={cn(
              "size-full transition-opacity duration-300",
              started ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="max-w-sm text-sm text-balance text-white/70">
              {t("rt.intro")}
            </p>
            <Button
              onClick={() => render(scene, quality)}
              disabled={status === "loading"}
            >
              <Play className="size-4 fill-current" />
              {status === "loading" ? `${t("rt.loading")}…` : t("rt.launch")}
            </Button>
          </div>
        )}

        {status === "rendering" && (
          <span className="absolute top-3 right-3 rounded-md bg-background/85 px-2 py-1 font-mono text-[11px] backdrop-blur-sm">
            {t("rt.rendering")}…
          </span>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          {t("rt.error")}
          {error && <span className="text-muted-foreground"> — {error}</span>}
        </p>
      )}

      {started && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Segmented
              label={t("rt.scene")}
              options={SCENES.map((s) => s.label)}
              value={SCENES.findIndex((s) => s.file === scene)}
              onChange={(index) => {
                setScene(SCENES[index].file);
                render(SCENES[index].file, quality);
              }}
            />
            <Segmented
              label={t("rt.quality")}
              options={QUALITIES.map((q) => t(q.key))}
              value={quality}
              onChange={(index) => {
                setQuality(index);
                render(scene, index);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              {t("rt.camera")}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label={t("rt.left")}
                onClick={() => nudge(PAN_STEP, 0, 0)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("rt.right")}
                onClick={() => nudge(-PAN_STEP, 0, 0)}
              >
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("rt.forward")}
                onClick={() => nudge(0, 0, DOLLY_STEP)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("rt.backward")}
                onClick={() => nudge(0, 0, -DOLLY_STEP)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={t("rt.reset")}
                onClick={recenter}
              >
                <Crosshair className="size-4" />
              </Button>
            </div>
          </div>

          {info && (
            <p className="font-mono text-xs text-muted-foreground">
              {info.width}×{info.height} · {info.primitives} {t("rt.primitives")}
              {info.ms !== null && ` · ${info.ms} ms`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-wrap rounded-lg border bg-card p-1">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(index)}
            aria-pressed={index === value}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              index === value
                ? "bg-brand text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
