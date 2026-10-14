"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { useDemoPalette, type DemoPalette } from "@/lib/demo-theme";
import { cn } from "@/lib/utils";

const MAPS = [
  { key: "small", file: "/dante/maps/small.txt" },
  { key: "medium", file: "/dante/maps/medium.txt" },
  { key: "large", file: "/dante/maps/large.txt" },
] as const;

type MapKey = (typeof MAPS)[number]["key"] | "custom";
type Kind = "perfect" | "imperfect";

/**
 * Le solveur raisonne en (ligne, colonne) : `V 3 7` désigne la ligne 3,
 * colonne 7 (voir solver.c, où `x` indexe `layout[x][y]` et se compare à
 * `maze->rows`). Les lire comme (x, y) revenait à transposer le chemin —
 * il traversait alors les murs.
 */
type Event = { type: "visited" | "path"; row: number; col: number };

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
    if (visited) events.push({ type: "visited", row: +visited[1], col: +visited[2] });
    else if (path) events.push({ type: "path", row: +path[1], col: +path[2] });
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
 *
 * Les labyrinthes « sur mesure » sortent du générateur du même dépôt
 * (vendor/dante/generator), lui aussi compilé en WebAssembly : le bouton
 * ne fabrique rien en JavaScript, il lance un second binaire.
 */
export function DanteDemo() {
  const { t } = usePrefs();
  const palette = useDemoPalette();
  // La démo se lance d'elle-même : son module pèse moins de 130 Ko, et
  // demander un second clic après celui qui ouvre la fiche ne protégeait
  // rien. Les jeux Emscripten, eux, gardent leur clic — ils pèsent des Mo.
  const [started] = useState(true);
  const [mapKey, setMapKey] = useState<MapKey>("small");
  const [size, setSize] = useState(31);
  const [kind, setKind] = useState<Kind>("imperfect");
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const gridRef = useRef<string[][] | null>(null);
  const frameRef = useRef<{ visited: Set<string>; path: Set<string> }>({
    visited: new Set(),
    path: new Set(),
  });
  const paletteRef = useRef<DemoPalette>(palette);
  const tokenRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = paletteRef.current;
    const { visited, path } = frameRef.current;
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const cell = canvas.width / cols;
    // Le fond transparaît entre les cases : sans ce liseré, une grande
    // carte devient un aplat où l'on ne distingue plus le quadrillage.
    const gap = cell >= 6 ? 1 : cell >= 3 ? 0.5 : 0;

    ctx.fillStyle = colors.grid;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = `${row},${col}`;
        ctx.fillStyle =
          grid[row][col] === "X"
            ? colors.wall
            : path.has(key)
              ? colors.path
              : visited.has(key)
                ? colors.visited
                : colors.free;
        ctx.fillRect(col * cell + gap / 2, row * cell + gap / 2, cell - gap, cell - gap);
      }
    }

    ctx.fillStyle = colors.start;
    ctx.fillRect(gap / 2, gap / 2, cell - gap, cell - gap);
    ctx.fillStyle = colors.end;
    ctx.fillRect(
      (cols - 1) * cell + gap / 2,
      (rows - 1) * cell + gap / 2,
      cell - gap,
      cell - gap,
    );
  };

  /** Redessine à l'identique quand le thème bascule. */
  useEffect(() => {
    paletteRef.current = palette;
    draw();
  }, [palette]);

  const solveMaze = (mazeText: string, token: number) => {
    const worker = workerRef.current;
    if (!worker || token !== tokenRef.current) return;

    const grid = parseGrid(mazeText);
    gridRef.current = grid;
    frameRef.current = { visited: new Set(), path: new Set() };

    const canvas = canvasRef.current;
    if (canvas) {
      const cols = grid[0]?.length ?? 1;
      const rows = grid.length;
      const width = 560;
      canvas.width = width;
      canvas.height = Math.round((width * rows) / cols);
    }
    draw();

    worker.postMessage({ type: "solve", token, mazeText });
  };

  const runMap = async (key: (typeof MAPS)[number]["key"]) => {
    const worker = workerRef.current;
    if (!worker) return;
    setSolving(true);
    setSolved(null);
    setMapKey(key);

    tokenRef.current += 1;
    const token = tokenRef.current;
    const map = MAPS.find((m) => m.key === key)!;
    const mazeText = await fetch(map.file).then((r) => r.text());

    // Le fetch ci-dessus a laissé la main : en React StrictMode (dev), l'effet
    // qui a créé `worker` peut avoir déjà été nettoyé (worker terminé) et
    // remonté sur une nouvelle instance entre-temps. Poster sur un worker mort
    // ne fait rien — silencieusement — d'où le blocage sans erreur. On revalide
    // que `worker` est toujours le worker courant avant de s'en servir.
    if (workerRef.current !== worker) return;
    solveMaze(mazeText, token);
  };

  /** Lance le générateur du dépôt ; la résolution enchaîne à sa réponse. */
  const generate = () => {
    const worker = workerRef.current;
    if (!worker) return;
    setSolving(true);
    setSolved(null);
    setMapKey("custom");

    tokenRef.current += 1;
    // Le générateur s'appuie sur srand() : sans graine explicite, deux
    // clics dans la même seconde rendraient deux fois le même labyrinthe.
    worker.postMessage({
      type: "generate",
      token: tokenRef.current,
      width: size,
      height: size,
      kind,
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  };

  const replay = () => {
    if (mapKey === "custom") {
      const grid = gridRef.current;
      if (!grid) return;
      setSolving(true);
      setSolved(null);
      tokenRef.current += 1;
      solveMaze(grid.map((row) => row.join("")).join("\n") + "\n", tokenRef.current);
      return;
    }
    runMap(mapKey);
  };

  const animate = (events: Event[], token: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const visited = new Set<string>();
    const path = new Set<string>();
    frameRef.current = { visited, path };
    // Un maze de 100x100 peut tracer plusieurs milliers de cases : on avance
    // par lots pour que l'animation dure quelques secondes quelle que soit
    // sa taille, plutôt que plusieurs minutes ou un instantané.
    const batch = Math.max(1, Math.ceil(events.length / 240));
    let i = 0;

    const step = () => {
      if (token !== tokenRef.current) return;
      for (let n = 0; n < batch && i < events.length; n++, i++) {
        const e = events[i];
        (e.type === "visited" ? visited : path).add(`${e.row},${e.col}`);
      }
      draw();
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
    const worker = new Worker("/dante/dante-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data.token !== tokenRef.current) return;
      if (event.data.type === "error") {
        setSolving(false);
        return;
      }
      if (event.data.type === "generated") {
        solveMaze(event.data.mazeText, event.data.token);
        return;
      }
      const { events, solved: didSolve } = parseEvents(event.data.output);
      setSolved(didSolve);
      animate(events, event.data.token);
    };
    runMap("small");
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-pretty text-muted-foreground">
        {t("dante.intro")}
      </p>
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-card">
        <div className="flex h-[60vh] max-h-[560px] min-h-[360px] w-full items-center justify-center p-4">
          <canvas ref={canvasRef} className="max-h-full max-w-full rounded" />
        </div>
      </div>

      {started && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">
              {t("dante.mapLabel")}
            </span>
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
              onClick={replay}
              className="ml-auto"
            >
              <RotateCcw className="size-3.5" />
              {t("dante.replay")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {t("dante.createLabel")}
            </span>
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <input
                type="range"
                min={11}
                max={101}
                step={2}
                value={size}
                disabled={solving}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-1 w-28 cursor-pointer accent-[var(--brand)] disabled:opacity-50"
              />
              <span className="tabular-nums text-foreground">
                {size}×{size}
              </span>
            </label>
            {(["imperfect", "perfect"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={kind === value ? "secondary" : "ghost"}
                disabled={solving}
                onClick={() => setKind(value)}
              >
                {t(value === "perfect" ? "dante.perfect" : "dante.imperfect")}
              </Button>
            ))}
            <Button
              size="sm"
              variant={mapKey === "custom" ? "default" : "outline"}
              disabled={solving}
              onClick={generate}
              className="ml-auto"
            >
              <Shuffle className="size-3.5" />
              {t("dante.generate")}
            </Button>
          </div>
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
              : " "}
        </p>
      )}
    </div>
  );
}
