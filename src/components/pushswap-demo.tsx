"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { useDemoPalette, type DemoPalette } from "@/lib/demo-theme";

const PRESETS = [
  { key: "shuffled", size: 25, kind: "shuffled", labelFr: "Mélangé", labelEn: "Shuffled" },
  { key: "reversed", size: 50, kind: "reversed", labelFr: "Inversé", labelEn: "Reversed" },
  { key: "almost", size: 100, kind: "almost", labelFr: "Presque trié", labelEn: "Nearly sorted" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"] | "custom";

function makeStack(size: number, kind: string): number[] {
  const values = Array.from({ length: size }, (_, i) => i + 1);
  if (kind === "reversed") return values.reverse();
  if (kind === "almost") {
    // Deux voisins échangés : le cas où le tri n'a presque rien à faire.
    const swapAt = Math.floor(Math.random() * (size - 1));
    [values[swapAt], values[swapAt + 1]] = [values[swapAt + 1], values[swapAt]];
    return values;
  }
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

/**
 * Les quatre opérations du sujet, telles que les implémentent r_case.c
 * (rotation) et p_case.c (transfert d'une pile à l'autre) : le programme
 * n'en émet que trois — `sa`/`sb` ne sont jamais produites — mais rejouer
 * l'opération plutôt que l'état final garde la démo honnête si le code
 * change.
 */
function apply(op: string, a: number[], b: number[]) {
  if (op === "ra" && a.length > 1) a.push(a.shift()!);
  else if (op === "rb" && b.length > 1) b.push(b.shift()!);
  else if (op === "pb" && a.length > 0) b.unshift(a.shift()!);
  else if (op === "pa" && b.length > 0) a.unshift(b.shift()!);
  else if (op === "sa" && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  else if (op === "sb" && b.length > 1) [b[0], b[1]] = [b[1], b[0]];
}

/**
 * Démo de push_swap compilé en WebAssembly.
 *
 * Le binaire C ne dessine rien : il reçoit les entiers en argv et écrit la
 * suite d'opérations sur la sortie standard. C'est donc lui qui trie —
 * la démo se contente de rejouer cette suite, opération par opération, sur
 * les deux piles. Ce qu'on voit bouger est le résultat du vrai algorithme,
 * pas un tri refait en JavaScript.
 */
export function PushSwapDemo() {
  const { t, lang } = usePrefs();
  const palette = useDemoPalette();
  // La démo se lance d'elle-même : son module pèse moins de 130 Ko, et
  // demander un second clic après celui qui ouvre la fiche ne protégeait
  // rien. Les jeux Emscripten, eux, gardent leur clic — ils pèsent des Mo.
  const [started] = useState(true);
  const [presetKey, setPresetKey] = useState<PresetKey>("shuffled");
  const [size, setSize] = useState(40);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [sorted, setSorted] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const tokenRef = useRef(0);
  const paletteRef = useRef<DemoPalette>(palette);
  const stacksRef = useRef<{ a: number[]; b: number[]; max: number }>({
    a: [],
    b: [],
    max: 1,
  });
  const opsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = paletteRef.current;
    const { a, b, max } = stacksRef.current;

    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 24;
    const columnWidth = (canvas.width - padding * 3) / 2;
    const slots = Math.max(a.length + b.length, 1);
    const inner = canvas.height - padding * 2 - 18;
    const barHeight = Math.min(22, inner / slots);
    const gap = barHeight >= 6 ? Math.min(3, barHeight * 0.2) : 0;
    // Sous une douzaine de pixels, la valeur écrite à côté de la barre se
    // chevaucherait d'une ligne à l'autre : la barre parle d'elle-même.
    const labelled = barHeight >= 12;
    const gutter = labelled ? 34 : 4;

    ctx.font = "12px ui-monospace, monospace";
    ctx.textBaseline = "middle";

    const column = (stack: number[], x: number, label: string, color: string) => {
      ctx.fillStyle = colors.grid;
      ctx.fillRect(x, padding + 18, columnWidth, inner);
      ctx.fillStyle = colors.free;
      ctx.fillText(label, x, padding + 4);

      for (let i = 0; i < stack.length; i++) {
        const width = (stack[i] / max) * (columnWidth - gutter - 6);
        const y = padding + 22 + i * barHeight;
        ctx.fillStyle = color;
        ctx.fillRect(x + gutter, y, Math.max(width, 2), Math.max(barHeight - gap, 1));
        if (!labelled) continue;
        ctx.fillStyle = colors.free;
        ctx.fillText(String(stack[i]).padStart(3, " "), x + 4, y + (barHeight - gap) / 2);
      }
    };

    column(a, padding, "a", colors.path);
    column(b, padding * 2 + columnWidth, "b", colors.visited);
  }, []);

  useEffect(() => {
    paletteRef.current = palette;
    draw();
  }, [palette, draw]);

  const stop = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  };

  /**
   * L'avancement se lit sur l'horloge, pas sur le nombre d'images rendues :
   * une pile de 25 valeurs sort quelques milliers d'opérations, une pile
   * inversée de 50 en sort plus de soixante-dix mille. Compter par image
   * ferait durer la grande dix fois trop longtemps dès que le rendu
   * ralentit ; viser une durée fixe garde la lecture identique quelle que
   * soit la taille. Les petites piles, elles, sont plafonnées à 24
   * opérations par seconde — plus vite, on ne verrait rien.
   */
  const play = useCallback(() => {
    stop();
    setPlaying(true);
    lastRef.current = 0;
    const token = tokenRef.current;
    const total = opsRef.current.length;
    const startIndex = indexRef.current;
    const duration = Math.min(10_000, ((total - startIndex) / 24) * 1000);

    const tick = (now: number) => {
      if (token !== tokenRef.current) return;
      if (!lastRef.current) lastRef.current = now;
      const ratio = duration > 0 ? (now - lastRef.current) / duration : 1;
      const target = Math.min(total, startIndex + Math.round(ratio * (total - startIndex)));
      if (target > indexRef.current) {
        const { a, b } = stacksRef.current;
        while (indexRef.current < target) {
          apply(opsRef.current[indexRef.current], a, b);
          indexRef.current += 1;
        }
        setDone(indexRef.current);
        draw();
      }
      if (indexRef.current < opsRef.current.length) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        const { a, b } = stacksRef.current;
        setSorted(b.length === 0 && a.every((v, i) => i === 0 || a[i - 1] <= v));
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const run = useCallback(
    (key: PresetKey, values: number[]) => {
      const worker = workerRef.current;
      if (!worker) return;
      stop();
      setPresetKey(key);
      setRunning(true);
      setPlaying(false);
      setSorted(null);
      setDone(0);
      setTotal(0);
      tokenRef.current += 1;
      opsRef.current = [];
      indexRef.current = 0;
      stacksRef.current = { a: [...values], b: [], max: Math.max(...values, 1) };
      draw();
      worker.postMessage({ type: "run", token: tokenRef.current, numbers: values });
    },
    [draw],
  );

  const initialRef = useRef<number[]>([]);

  const runPreset = useCallback(
    (key: (typeof PRESETS)[number]["key"]) => {
      const preset = PRESETS.find((p) => p.key === key)!;
      const values = makeStack(preset.size, preset.kind);
      initialRef.current = values;
      run(key, values);
    },
    [run],
  );

  const generate = () => {
    const values = makeStack(size, "shuffled");
    initialRef.current = values;
    run("custom", values);
  };

  /** Rejoue la même pile : mêmes valeurs, donc exactement les mêmes opérations. */
  const replay = () => {
    if (initialRef.current.length === 0) return;
    stop();
    tokenRef.current += 1;
    stacksRef.current = {
      a: [...initialRef.current],
      b: [],
      max: Math.max(...initialRef.current, 1),
    };
    indexRef.current = 0;
    setDone(0);
    setSorted(null);
    draw();
    play();
  };

  useEffect(() => {
    if (!started) return;
    const worker = new Worker("/pushswap/pushswap-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data.token !== tokenRef.current) return;
      setRunning(false);
      if (event.data.type === "error") return;
      opsRef.current = event.data.ops;
      indexRef.current = 0;
      setTotal(event.data.ops.length);
      if (event.data.ops.length === 0) {
        setSorted(true);
        return;
      }
      play();
    };
    runPreset("shuffled");
    return () => {
      stop();
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
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [started, draw]);

  const toggle = () => {
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    if (indexRef.current >= opsRef.current.length) {
      replay();
      return;
    }
    play();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-pretty text-muted-foreground">
        {t("pushswap.intro")}
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
              {t("pushswap.stackLabel")}
            </span>
            {PRESETS.map((preset) => (
              <Button
                key={preset.key}
                size="sm"
                variant={presetKey === preset.key ? "default" : "outline"}
                disabled={running}
                onClick={() => runPreset(preset.key)}
              >
                {lang === "fr" ? preset.labelFr : preset.labelEn} · {preset.size}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={running}
              onClick={toggle}
              className="ml-auto"
            >
              {playing ? (
                <Pause className="size-3.5" />
              ) : total > 0 && done >= total ? (
                <RotateCcw className="size-3.5" />
              ) : (
                <Play className="size-3.5 fill-current" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-2.5 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {t("pushswap.createLabel")}
            </span>
            <label className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {t("pushswap.sizeLabel")}
              <input
                type="range"
                min={3}
                max={100}
                step={1}
                value={size}
                disabled={running}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer accent-[var(--brand)] disabled:opacity-50"
              />
              <span className="tabular-nums text-foreground">{size}</span>
            </label>
            <Button
              size="sm"
              variant={presetKey === "custom" ? "default" : "outline"}
              disabled={running}
              onClick={generate}
              className="ml-auto"
            >
              <Shuffle className="size-3.5" />
              {t("pushswap.generate")}
            </Button>
          </div>
        </div>
      )}

      {started && (
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {running
            ? "…"
            : total === 0 && sorted
              ? t("pushswap.already")
              : `${t("pushswap.opsLabel")} : ${done} / ${total}${
                  sorted ? ` · ${t("pushswap.sorted")}` : ""
                }`}
        </p>
      )}
    </div>
  );
}
