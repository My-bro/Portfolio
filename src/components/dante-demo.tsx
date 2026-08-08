"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const MAPS = [
  { key: "small", file: "/dante/maps/small.txt" },
  { key: "medium", file: "/dante/maps/medium.txt" },
  { key: "large", file: "/dante/maps/large.txt" },
] as const;

type Event = { type: "visited" | "path"; x: number; y: number };

function parseGrid(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => [...line]);
}

function parseEvents(output: string): { events: Event[]; solved: boolean } {
  const events: Event[] = [];
  let solved = false;
  for (const line of output.split("\n")) {
    const visited = /^V (\d+) (\d+)$/.exec(line);
    const path = /^P (\d+) (\d+)$/.exec(line);
    if (visited) events.push({ type: "visited", x: +visited[1], y: +visited[2] });
    else if (path) events.push({ type: "path", x: +path[1], y: +path[2] });
    else if (line === "DONE") solved = true;
  }
  return { events, solved };
}

/**
 * Démo du solveur de labyrinthe de Dante compilé en WebAssembly.
 *
 * Le binaire trace sa vraie exécution (voir vendor/dante/solver/lib_solver/
 * solver.c) : chaque case explorée pendant le BFS, puis le chemin trouvé.
 * Ce composant ne fait que rejouer ce flux sur un canevas — l'algorithme
 * qui tourne est le vrai code C, pas une reconstitution en JS.
 */
export function DanteDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);
  const [mapKey, setMapKey] = useState<(typeof MAPS)[number]["key"]>("small");
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const gridRef = useRef<string[][] | null>(null);
  const tokenRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const draw = (grid: string[][], visited: Set<string>, path: Set<string>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const cell = canvas.width / cols;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const key = `${x},${y}`;
        const isWall = grid[y][x] === "X";
        ctx.fillStyle = isWall
          ? "#1c1c1c"
          : path.has(key)
            ? "#ff6b3d"
            : visited.has(key)
              ? "#3d6bff55"
              : "#e8e8e8";
        ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      }
    }
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, 0, cell, cell);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect((cols - 1) * cell, (rows - 1) * cell, cell, cell);
  };

  const runMap = async (key: (typeof MAPS)[number]["key"]) => {
    const worker = workerRef.current;
    if (!worker) return;
    setSolving(true);
    setSolved(null);
    setMapKey(key);

    const map = MAPS.find((m) => m.key === key)!;
    const mazeText = await fetch(map.file).then((r) => r.text());
    const grid = parseGrid(mazeText);
    gridRef.current = grid;

    const canvas = canvasRef.current;
    if (canvas) {
      const cols = grid[0]?.length ?? 1;
      const rows = grid.length;
      const size = 560;
      canvas.width = size;
      canvas.height = Math.round((size * rows) / cols);
    }
    draw(grid, new Set(), new Set());

    // Le fetch ci-dessus a laissé la main : en React StrictMode (dev), l'effet
    // qui a créé `worker` peut avoir déjà été nettoyé (worker terminé) et
    // remonté sur une nouvelle instance entre-temps. Poster sur un worker mort
    // ne fait rien — silencieusement — d'où le blocage sans erreur. On revalide
    // que `worker` est toujours le worker courant avant de s'en servir.
    if (workerRef.current !== worker) return;

    tokenRef.current += 1;
    const token = tokenRef.current;

    worker.onmessage = (event) => {
      if (event.data.token !== token) return;
      if (event.data.type === "error") {
        setSolving(false);
        return;
      }
      const { events, solved: didSolve } = parseEvents(event.data.output);
      animate(grid, events, token);
      setSolved(didSolve);
    };
    worker.postMessage({ type: "solve", token, mazeText });
  };

  const animate = (grid: string[][], events: Event[], token: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const visited = new Set<string>();
    const path = new Set<string>();
    // Un maze de 100x100 peut tracer plusieurs milliers de cases : on avance
    // par lots pour que l'animation dure quelques secondes quelle que soit
    // sa taille, plutôt que plusieurs minutes ou un instantané.
    const batch = Math.max(1, Math.ceil(events.length / 240));
    let i = 0;

    const step = () => {
      if (token !== tokenRef.current) return;
      for (let n = 0; n < batch && i < events.length; n++, i++) {
        const e = events[i];
        (e.type === "visited" ? visited : path).add(`${e.x},${e.y}`);
      }
      draw(grid, visited, path);
      if (i < events.length) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setSolving(false);
      }
    };
    step();
  };

  useEffect(() => {
    if (!started) return;
    workerRef.current = new Worker("/dante/dante-worker.js", { type: "module" });
    runMap("small");
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-black">
        <div className="flex h-[60vh] max-h-[560px] min-h-[360px] w-full items-center justify-center p-4">
          {started ? (
            <canvas ref={canvasRef} className="max-h-full max-w-full rounded" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("dante.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("dante.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{t("dante.mapLabel")}</span>
          {MAPS.map((map) => (
            <Button
              key={map.key}
              size="sm"
              variant={mapKey === map.key ? "default" : "outline"}
              disabled={solving}
              onClick={() => runMap(map.key)}
            >
              {map.key}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={solving}
            onClick={() => runMap(mapKey)}
            className="ml-auto"
          >
            <RotateCcw className="size-3.5" />
            {t("dante.replay")}
          </Button>
        </div>
      )}

      {started && (
        <p
          className={cn(
            "font-mono text-xs",
            solved === false ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {solving
            ? t("dante.solving")
            : solved === false
              ? t("dante.noSolution")
              : " "}
        </p>
      )}
    </div>
  );
}
