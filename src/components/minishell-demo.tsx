"use client";

import { useEffect, useRef, useState } from "react";
import { Play, TerminalSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const EXAMPLES = ["cd /tmp", "setenv NOM valeur", "env", "ls", "exit"];

/**
 * Démo de minishell compilé en WebAssembly.
 *
 * Le programme ne rend la main qu'à l'EOF de stdin (sa boucle `while (1)`
 * interne) — pas d'Asyncify ici : chaque commande soumise relance le
 * binaire depuis le début, sur son propre worker, avec tout l'historique en
 * guise de stdin. `cd`/`setenv` gardent leur effet d'une commande à l'autre
 * puisque l'historique entier se rejoue dans l'ordre à chaque fois.
 *
 * Les built-ins (cd, setenv, unsetenv, env, exit) sont le vrai code C,
 * compilé tel quel. Les commandes externes (ls, cat…) échouent pour de
 * vraies raisons : il n'existe pas de vrais binaires système dans un
 * bac à sable WebAssembly pour un fork()+execve() d'y atterrir.
 */
export function MinishellDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const tokenRef = useRef(0);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!started) return;
    const worker = new Worker("/minishell/minishell-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data.type === "ready") {
        setReady(true);
        return;
      }
      if (event.data.token !== tokenRef.current) return;
      setOutput(event.data.output);
      setRunning(false);
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [started]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [output]);

  const runLine = (line: string) => {
    const worker = workerRef.current;
    if (!worker || running) return;
    const next = [...history, line];
    tokenRef.current += 1;
    setHistory(next);
    setRunning(true);
    worker.postMessage({ type: "run", token: tokenRef.current, transcript: next.join("\n") + "\n" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const line = input.trim();
    if (!line) return;
    setInput("");
    runLine(line);
  };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-black">
        <div className="flex h-[60vh] max-h-[560px] min-h-[360px] w-full flex-col">
          {started ? (
            <>
              <div
                ref={logRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm whitespace-pre-wrap text-green-400"
                onClick={() => inputRef.current?.focus()}
              >
                {output}
                {!running && <span className="text-green-400">$&gt; </span>}
                {running && <span className="text-white/40">…</span>}
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-white/10 px-4 py-2"
              >
                <span className="font-mono text-sm text-green-400">$&gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!ready || running}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent font-mono text-sm text-green-400 outline-none placeholder:text-white/30 disabled:opacity-50"
                  placeholder={t("minishell.placeholder")}
                />
              </form>
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-sm text-sm text-balance text-white/70">
                {t("minishell.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("minishell.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <div className="flex flex-wrap items-center gap-1.5">
          <TerminalSquare className="size-3.5 text-muted-foreground" />
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => runLine(example)}
              disabled={!ready || running}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-[11px] text-muted-foreground",
                "transition-colors hover:border-brand/50 hover:text-foreground disabled:opacity-50",
              )}
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {started && (
        <p className="font-mono text-xs text-muted-foreground">{t("minishell.hint")}</p>
      )}
    </div>
  );
}
