"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const MAPS = [
  { key: "sparse", size: 30, pattern: "..........o..........", labelFr: "Épars", labelEn: "Sparse" },
  { key: "medium", size: 40, pattern: ".......o....o.......o", labelFr: "Moyen", labelEn: "Medium" },
  { key: "dense", size: 25, pattern: "o..o..o..", labelFr: "Dense", labelEn: "Dense" },
] as const;

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
 * motif répété — pas de fichier à écrire, la carte part en argv.
 *
 * Le panoramique/zoom est une vue construite ici, pas une fonctionnalité du
 * programme d'origine : sur une vraie carte de 10 000x10 000 (annoncée
 * comme prise en charge, non testée en direct dans un onglet de
 * navigateur), il n'y aurait de toute façon rien d'autre à faire que
 * naviguer dans un résultat déjà calculé.
 */
export function BsqDemo() {
  const { t, lang } = usePrefs();
  const [started, setStarted] = useState(false);
  const [mapKey, setMapKey] = useState<(typeof MAPS)[number]["key"]>("sparse");
  const [running, setRunning] = useState(false);
  const [squareSize, setSquareSize] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tokenRef = useRef(0);
  const gridRef = useRef<string[][] | null>(null);
  const viewRef = useRef({ scale: 14, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { scale, x, y } = viewRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const c = grid[row][col];
        ctx.fillStyle = c === "o" ? "#3a3a3a" : c === "x" ? "#ff6b3d" : "#e8e8e8";
        ctx.fillRect(col, row, 1.02, 1.02);
      }
    }
  };

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

  const runMap = async (key: (typeof MAPS)[number]["key"]) => {
    const worker = workerRef.current;
    if (!worker) return;
    const map = MAPS.find((m) => m.key === key)!;
    setMapKey(key);
    setRunning(true);
    setSquareSize(null);

    tokenRef.current += 1;
    const token = tokenRef.current;
    worker.onmessage = (event) => {
      if (event.data.token !== token) return;
      setRunning(false);
      if (event.data.type === "error") return;
      const grid = parseGrid(event.data.output);
      gridRef.current = grid;
      const found = grid.flat().filter((c) => c === "x").length;
      setSquareSize(found > 0 ? Math.round(Math.sqrt(found)) : 0);
      resetView(grid);
      draw();
    };
    worker.postMessage({ type: "run", token, size: map.size, pattern: map.pattern });
  };

  useEffect(() => {
    if (!started) return;
    workerRef.current = new Worker("/bsq/bsq-worker.js", { type: "module" });
    runMap("sparse");
    return () => {
      workerRef.current?.terminate();
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
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-black">
        <div className="relative h-[60vh] max-h-[560px] min-h-[360px] w-full">
          {started ? (
            <canvas
              ref={canvasRef}
              className="size-full cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onWheel={onWheel}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{t("bsq.mapLabel")}</span>
          {MAPS.map((map) => (
            <Button
              key={map.key}
              size="sm"
              variant={mapKey === map.key ? "default" : "outline"}
              disabled={running}
              onClick={() => runMap(map.key)}
            >
              {lang === "fr" ? map.labelFr : map.labelEn} · {map.size}²
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={() => runMap(mapKey)}
            className="ml-auto"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      )}

      {started && (
        <p className={cn("font-mono text-xs", "text-muted-foreground")}>
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
