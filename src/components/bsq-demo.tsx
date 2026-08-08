"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { useDemoPalette, type DemoPalette } from "@/lib/demo-theme";

const PRESETS = [
  { key: "sparse", size: 30, density: 0.06, labelFr: "Épars", labelEn: "Sparse" },
  { key: "medium", size: 40, density: 0.16, labelFr: "Moyen", labelEn: "Medium" },
  { key: "dense", size: 25, density: 0.32, labelFr: "Dense", labelEn: "Dense" },
] as const;

type MapKey = (typeof PRESETS)[number]["key"] | "custom";

/**
 * Le programme génère lui-même sa carte à partir d'un motif répété (voir
 * lib_bsq/map_case.c) : il la remplit en boucle, caractère par caractère.
 * Un motif plus court que la carte se répète donc visiblement — d'où les
 * rayures régulières des premières versions de cette démo. Un motif de
 * `taille²` caractères couvre exactement la carte : plus aucune répétition,
 * chaque case est tirée indépendamment.
 */
function randomPattern(size: number, density: number): string {
  const cells = new Array<string>(size * size);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = Math.random() < density ? "o" : ".";
  }
  return cells.join("");
}

function parseGrid(output: string): string[][] {
  return output
    .split("\n")
    .filter((line) => line.length > 0 && /^[.ox]+$/.test(line))
    .map((line) => [...line]);
}

/**
 * Démo de bsq (« biggest square ») compilé en WebAssembly.
 *
 * Une seule passe : le vrai programme calcule le plus grand carré de cases
 * libres par programmation dynamique (voir vendor/bsq/lib_bsq/
 * find_coor_max.c, invert_demine.c) et renvoie la grille finale, carré
 * marqué. Le mode `bsq <taille> <motif>` génère lui-même la carte depuis un
 * motif — pas de fichier à écrire, la carte part en argv.
 *
 * Le panoramique/zoom est une vue construite ici, pas une fonctionnalité du
 * programme d'origine : sur une vraie carte de 10 000x10 000 (annoncée
 * comme prise en charge, non testée en direct dans un onglet de
 * navigateur), il n'y aurait de toute façon rien d'autre à faire que
 * naviguer dans un résultat déjà calculé.
 */
export function BsqDemo() {
  const { t, lang } = usePrefs();
  const palette = useDemoPalette();
  const [started, setStarted] = useState(false);
  const [mapKey, setMapKey] = useState<MapKey>("sparse");
  const [size, setSize] = useState(48);
  const [density, setDensity] = useState(0.2);
  const [running, setRunning] = useState(false);
  const [squareSize, setSquareSize] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tokenRef = useRef(0);
  const gridRef = useRef<string[][] | null>(null);
  const paletteRef = useRef<DemoPalette>(palette);
  const viewRef = useRef({ scale: 14, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = paletteRef.current;
    const { scale, x, y } = viewRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Le liseré entre les cases est exprimé en pixels écran puis ramené en
    // unités de grille : dézoomé, il maigrit au lieu d'avaler la case, et
    // le quadrillage reste lisible au lieu de fondre en un aplat.
    const gapPx = scale >= 7 ? 1 : scale >= 3.5 ? 0.75 : scale >= 2 ? 0.5 : 0;
    const gap = gapPx / scale;
    const cell = 1 - gap;

    if (gap > 0) {
      ctx.fillStyle = colors.grid;
      ctx.fillRect(0, 0, grid[0]?.length ?? 0, grid.length);
    }

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const c = grid[row][col];
        ctx.fillStyle = c === "o" ? colors.wall : c === "x" ? colors.path : colors.free;
        ctx.fillRect(col + gap / 2, row + gap / 2, cell, cell);
      }
    }
  };

  useEffect(() => {
    paletteRef.current = palette;
    draw();
  }, [palette]);

  const resetView = (grid: string[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = grid[0]?.length ?? 1;
    const rows = grid.length;
    const scale = Math.min(canvas.width / cols, canvas.height / rows) * 0.92;
    viewRef.current = {
      scale,
      x: (canvas.width - cols * scale) / 2,
      y: (canvas.height - rows * scale) / 2,
    };
  };

  const run = (key: MapKey, mapSize: number, pattern: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    setMapKey(key);
    setRunning(true);
    setSquareSize(null);

    tokenRef.current += 1;
    worker.postMessage({
      type: "run",
      token: tokenRef.current,
      size: mapSize,
      pattern,
    });
  };

  const runPreset = (key: (typeof PRESETS)[number]["key"]) => {
    const preset = PRESETS.find((m) => m.key === key)!;
    run(key, preset.size, randomPattern(preset.size, preset.density));
  };

  const generate = () => run("custom", size, randomPattern(size, density));

  const replay = () => {
    if (mapKey === "custom") generate();
    else runPreset(mapKey);
  };

  useEffect(() => {
    if (!started) return;
    const worker = new Worker("/bsq/bsq-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data.token !== tokenRef.current) return;
      setRunning(false);
      if (event.data.type === "error") return;
      const grid = parseGrid(event.data.output);
      gridRef.current = grid;
      const found = grid.flat().filter((c) => c === "x").length;
      setSquareSize(found > 0 ? Math.round(Math.sqrt(found)) : 0);
      resetView(grid);
      draw();
    };
    runPreset("sparse");
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !started) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (gridRef.current) {
        resetView(gridRef.current);
        draw();
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [started]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX - viewRef.current.x, y: e.clientY - viewRef.current.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    viewRef.current.x = e.clientX - dragRef.current.x;
    viewRef.current.y = e.clientY - dragRef.current.y;
    draw();
  };
  const endDrag = () => {
    dragRef.current = null;
  };
  /**
   * La molette zoome sur le pointeur. React attache ses écouteurs `wheel`
   * en mode passif : un `preventDefault()` posé via `onWheel` est ignoré —
   * la console le signale et la page défile pendant le zoom. D'où
   * l'écouteur natif, seul moyen de demander `passive: false`.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !started) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { scale, x, y } = viewRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = Math.min(60, Math.max(2, scale * factor));
      viewRef.current = {
        scale: next,
        x: mx - ((mx - x) / scale) * next,
        y: my - ((my - y) / scale) * next,
      };
      draw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [started]);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-card">
        <div className="relative h-[60vh] max-h-[560px] min-h-[360px] w-full">
          {started ? (
            <canvas
              ref={canvasRef}
              className="size-full cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-muted-foreground">
                {t("bsq.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("bsq.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">{t("bsq.mapLabel")}</span>
            {PRESETS.map((preset) => (
              <Button
                key={preset.key}
                size="sm"
                variant={mapKey === preset.key ? "default" : "outline"}
                disabled={running}
                onClick={() => runPreset(preset.key)}
              >
                {lang === "fr" ? preset.labelFr : preset.labelEn} · {preset.size}²
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={running}
              onClick={replay}
              className="ml-auto"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-2.5 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {t("bsq.createLabel")}
            </span>
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {t("bsq.sizeLabel")}
              <input
                type="range"
                min={10}
                max={200}
                step={2}
                value={size}
                disabled={running}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer accent-[var(--brand)] disabled:opacity-50"
              />
              <span className="tabular-nums text-foreground">{size}²</span>
            </label>
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {t("bsq.densityLabel")}
              <input
                type="range"
                min={2}
                max={60}
                step={1}
                value={Math.round(density * 100)}
                disabled={running}
                onChange={(e) => setDensity(Number(e.target.value) / 100)}
                className="h-1 w-24 cursor-pointer accent-[var(--brand)] disabled:opacity-50"
              />
              <span className="tabular-nums text-foreground">{Math.round(density * 100)}%</span>
            </label>
            <Button
              size="sm"
              variant={mapKey === "custom" ? "default" : "outline"}
              disabled={running}
              onClick={generate}
              className="ml-auto"
            >
              <Shuffle className="size-3.5" />
              {t("bsq.generate")}
            </Button>
          </div>
        </div>
      )}

      {started && (
        <p className="font-mono text-xs text-muted-foreground">
          {running
            ? "…"
            : squareSize
              ? `${t("bsq.resultFound")} : ${squareSize}×${squareSize}`
              : squareSize === 0
                ? t("bsq.resultNone")
                : " "}
        </p>
      )}
    </div>
  );
}
