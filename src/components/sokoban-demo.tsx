"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { useDemoPalette, type DemoPalette } from "@/lib/demo-theme";
import { cn } from "@/lib/utils";

const MAPS = [
  { key: "mini", file: "/sokoban/maps/mini.txt", labelFr: "Mini", labelEn: "Mini" },
  {
    key: "entrepot",
    file: "/sokoban/maps/entrepot.txt",
    labelFr: "Entrepôt",
    labelEn: "Warehouse",
  },
  { key: "etoile", file: "/sokoban/maps/etoile.txt", labelFr: "Étoile", labelEn: "Star" },
] as const;

type MapKey = (typeof MAPS)[number]["key"];

/**
 * Valeurs de ncurses, reprises telles quelles par wasm/shims/curses.h :
 * movement.c et push_mvt.c comparent la touche reçue à ces constantes, on
 * leur envoie donc les mêmes codes que le terminal.
 */
const KEY = { up: 0o403, down: 0o402, left: 0o404, right: 0o405 } as const;

type Dir = keyof typeof KEY;

const BINDINGS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  z: "up",
  w: "up",
  s: "down",
  q: "left",
  a: "left",
  d: "right",
};

/**
 * Démo de my_sokoban compilé en WebAssembly.
 *
 * Le jeu natif tient dans une boucle bloquante autour de getch() ; le
 * portage la découpe en un appel par touche (voir vendor/sokoban/wasm/
 * main_wasm.c). Chaque flèche envoie donc son code ncurses au vrai binaire,
 * qui renvoie l'écran qu'il aurait dessiné avec printw(). Ce composant ne
 * décide de rien : il envoie la touche et peint la grille reçue.
 */
export function SokobanDemo() {
  const { t, lang } = usePrefs();
  const palette = useDemoPalette();
  // La démo se lance d'elle-même : son module pèse moins de 130 Ko, et
  // demander un second clic après celui qui ouvre la fiche ne protégeait
  // rien. Les jeux Emscripten, eux, gardent leur clic — ils pèsent des Mo.
  const [started] = useState(true);
  const [mapKey, setMapKey] = useState<MapKey>("entrepot");
  const [state, setState] = useState(0);
  const [moves, setMoves] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tokenRef = useRef(0);
  const gridRef = useRef<string[][] | null>(null);
  const paletteRef = useRef<DemoPalette>(palette);
  const stateRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = paletteRef.current;
    const rows = grid.length;
    const cols = Math.max(...grid.map((row) => row.length), 1);
    const cell = Math.min(canvas.width / cols, canvas.height / rows);
    const offsetX = (canvas.width - cols * cell) / 2;
    const offsetY = (canvas.height - rows * cell) / 2;
    const gap = cell >= 12 ? 2 : 1;

    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const c = grid[row][col];
        const x = offsetX + col * cell;
        const y = offsetY + row * cell;
        // La caisse et le joueur sont posés sur le sol : le carreau est
        // peint d'abord, la pièce ensuite, plus petite — sinon une caisse
        // sur son emplacement se lit comme un mur.
        ctx.fillStyle = c === "#" ? colors.wall : colors.free;
        ctx.fillRect(x + gap / 2, y + gap / 2, cell - gap, cell - gap);
        if (c === "#" || c === " ") continue;
        const inset = cell * 0.18;
        ctx.fillStyle =
          c === "P" ? colors.start : c === "X" ? colors.path : colors.end;
        if (c === "O") {
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell * 0.18, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);
        }
      }
    }
  }, []);

  useEffect(() => {
    paletteRef.current = palette;
    draw();
  }, [palette, draw]);

  const load = useCallback(async (key: MapKey) => {
    const worker = workerRef.current;
    if (!worker) return;
    setMapKey(key);
    setMoves(0);
    setState(0);
    stateRef.current = 0;
    tokenRef.current += 1;
    const token = tokenRef.current;
    const map = await fetch(MAPS.find((m) => m.key === key)!.file).then((r) =>
      r.text(),
    );
    // Le fetch a laissé la main : en StrictMode (dev), le worker créé par
    // l'effet peut avoir été terminé et remplacé entre-temps.
    if (workerRef.current !== worker) return;
    worker.postMessage({ type: "load", token, map });
  }, []);

  const press = useCallback((dir: Dir) => {
    const worker = workerRef.current;
    if (!worker || stateRef.current !== 0) return;
    worker.postMessage({ type: "key", token: tokenRef.current, key: KEY[dir] });
    setMoves((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!started) return;
    const worker = new Worker("/sokoban/sokoban-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data.token !== tokenRef.current) return;
      if (event.data.type === "error") return;
      gridRef.current = event.data.screen
        .split("\n")
        .filter((line: string) => line.length > 0)
        .map((line: string) => [...line]);
      stateRef.current = event.data.state;
      setState(event.data.state);
      draw();
    };
    load("entrepot");
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  /**
   * Les flèches font défiler la page : l'écouteur est posé sur la fenêtre
   * pour que le jeu reste jouable sans avoir à cliquer dans le canevas, et
   * il annule le défilement sur les touches qu'il consomme.
   */
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const dir = BINDINGS[e.key] ?? BINDINGS[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      press(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, press]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !started) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [started, draw]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-pretty text-muted-foreground">
        {t("sokoban.intro")}
      </p>
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-card">
        <div className="relative h-[60vh] max-h-[560px] min-h-[360px] w-full">
          <canvas ref={canvasRef} className="size-full" />
        </div>
      </div>

      {started && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">
              {t("sokoban.mapLabel")}
            </span>
            {MAPS.map((map) => (
              <Button
                key={map.key}
                size="sm"
                variant={mapKey === map.key ? "default" : "outline"}
                onClick={() => load(map.key)}
              >
                {lang === "fr" ? map.labelFr : map.labelEn}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => load(mapKey)}
              className="ml-auto"
            >
              <RotateCcw className="size-3.5" />
              {t("sokoban.restart")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {t("sokoban.keysLabel")}
            </span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" onClick={() => press("left")}>
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="outline" onClick={() => press("up")}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => press("down")}>
                  <ArrowDown className="size-4" />
                </Button>
              </div>
              <Button size="icon" variant="outline" onClick={() => press("right")}>
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
              {t("sokoban.moves")} : {moves}
            </span>
          </div>
        </div>
      )}

      {started && (
        <p
          className={cn(
            "font-mono text-xs",
            state === 2 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {state === 1 ? t("sokoban.won") : state === 2 ? t("sokoban.lost") : " "}
        </p>
      )}
    </div>
  );
}
