"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { CASES, type Case } from "@/lib/minilibc-cases";
import {
  makeState,
  parseAsm,
  step,
  REGISTERS,
  type MachineState,
  type Program,
  type Register,
} from "@/lib/asm-machine";
import { cn } from "@/lib/utils";

const BASE = 0x1000;
const MEMORY = 128;
/** Chaque argument a son tampon, assez espacé pour rester lisible. */
const SLOT = 32;

/** Registres que la convention System V donne aux trois premiers arguments. */
const ROLE: Partial<Record<Register, string>> = {
  rdi: "1ᵉʳ argument",
  rsi: "2ᵉ argument",
  rdx: "3ᵉ argument",
  rax: "valeur de retour",
};

interface Setup {
  program: Program;
  state: MachineState;
  slots: { text: string; offset: number }[];
}

function prepare(source: string, entry: Case): Setup {
  const program = parseAsm(source);
  const state = makeState(MEMORY, BASE);
  const slots: { text: string; offset: number }[] = [];

  entry.args.forEach((arg, index) => {
    if (arg.kind === "string") {
      const offset = slots.length * SLOT;
      const text = String(arg.value);
      for (let i = 0; i < text.length; i++) state.memory[offset + i] = text.charCodeAt(i);
      state.memory[offset + text.length] = 0;
      slots.push({ text, offset });
      state.registers[arg.register] = BASE + offset;
      return;
    }
    if (arg.kind === "char") {
      state.registers[arg.register] = String(arg.value).charCodeAt(0);
      return;
    }
    state.registers[arg.register] = Number(arg.value);
    void index;
  });

  return { program, state, slots };
}

/** Clone : React ne voit un changement que sur un objet neuf. */
function snapshot(state: MachineState): MachineState {
  return {
    ...state,
    registers: { ...state.registers },
    memory: state.memory.slice(),
    compared: [...state.compared] as [number, number],
  };
}

/**
 * Démo de minilibC : les fonctions assembleur du projet, exécutées.
 *
 * Le projet réimplémente une douzaine de fonctions de la libc en x86-64,
 * appelées depuis du C par dlopen/dlsym. Aucun navigateur ne sait exécuter
 * ça — mais les quatorze instructions employées tiennent dans un
 * interpréteur (voir src/lib/asm-machine.ts), et les fichiers .asm chargés
 * ici sont ceux du dépôt, sans une ligne changée.
 *
 * Ce qu'on regarde : quel registre porte quel argument. C'est toute la
 * convention d'appel System V — rdi, rsi, rdx pour les arguments, rax pour
 * le retour — et elle devient visible quand on avance instruction par
 * instruction.
 */
export function MinilibcDemo() {
  const { t } = usePrefs();
  const [started, setStarted] = useState(false);
  const [caseKey, setCaseKey] = useState(CASES[0].key);
  const [source, setSource] = useState<string | null>(null);
  // Remettre à zéro, c'est repartir d'une machine neuve : le compteur
  // suffit à en refabriquer une, sans effet de bord à écrire.
  const [generation, setGeneration] = useState(0);
  const [view, setView] = useState<{ setup: Setup; state: MachineState } | null>(null);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  const entry = useMemo(() => CASES.find((c) => c.key === caseKey)!, [caseKey]);

  useEffect(() => {
    if (!started) return;
    let alive = true;
    fetch(`/minilibc/${entry.file}.asm`)
      .then((r) => r.text())
      .then((text) => {
        if (!alive) return;
        setSource(text);
      });
    return () => {
      alive = false;
    };
  }, [started, entry]);

  // La machine ne dépend que du source, du cas choisi et du compteur de
  // remises à zéro : elle se déduit, elle ne se synchronise pas.
  const setup = useMemo(
    () => (source ? prepare(source, entry) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, entry, generation],
  );
  const initial = useMemo(() => (setup ? snapshot(setup.state) : null), [setup]);
  const state = view?.setup === setup ? view.state : initial;

  const reset = useCallback(() => {
    setPlaying(false);
    setGeneration((g) => g + 1);
  }, []);

  const advance = useCallback(() => {
    if (!setup) return false;
    const running = step(setup.state, setup.program);
    setView({ setup, state: snapshot(setup.state) });
    return running;
  }, [setup]);

  useEffect(() => {
    if (!playing) return;
    // Une exécution complète fait quelques dizaines d'instructions : à
    // cette cadence, on suit les registres à l'œil.
    timerRef.current = window.setInterval(() => {
      if (!advance()) setPlaying(false);
    }, 140);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, advance]);

  if (!started) {
    return (
      <div className="space-y-3">
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-lg border bg-card px-6 text-center">
          <p className="max-w-md text-sm text-balance text-muted-foreground">
            {t("minilibc.intro")}
          </p>
          <Button onClick={() => setStarted(true)}>
            <Play className="size-4 fill-current" />
            {t("minilibc.launch")}
          </Button>
        </div>
      </div>
    );
  }

  const done = state?.done ?? false;
  const expected = entry.expect(entry.args.map((a) => a.value));
  const actual = state ? describeResult(entry, state, setup) : "";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {entry.signature}
              </p>
              <p className="font-mono text-sm text-foreground">{entry.call}</p>
            </div>

            <table className="w-full border-separate border-spacing-y-1 text-left font-mono text-xs">
              <tbody>
                {REGISTERS.filter(
                  (r) => ROLE[r] || (state?.registers[r] ?? 0) !== 0,
                ).map((register) => {
                  const value = state?.registers[register] ?? 0;
                  const touched = state ? touches(state, setup, register) : false;
                  return (
                    <tr key={register}>
                      <td
                        className={cn(
                          "w-14 rounded px-1.5 py-0.5",
                          touched ? "bg-[var(--brand)] text-background" : "text-foreground",
                        )}
                      >
                        {register}
                      </td>
                      <td className="px-2 tabular-nums text-muted-foreground">
                        {formatValue(value, setup)}
                      </td>
                      <td className="px-1 text-[11px] text-muted-foreground/70">
                        {ROLE[register] ??
                          (register === "rax" ? "" : t("minilibc.scratch"))}
                        {ROLE[register] && argRole(entry, register)
                          ? ` · ${argRole(entry, register)}`
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {setup && state && (
              <div className="space-y-1">
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t("minilibc.memory")}
                </p>
                {setup.slots.map((slot) => (
                  <MemoryStrip key={slot.offset} slot={slot} state={state} />
                ))}
              </div>
            )}

            <p className="font-mono text-xs">
              <span className="text-muted-foreground">{t("minilibc.result")} : </span>
              <span className={cn(done && actual === expected && "text-[var(--brand)]")}>
                {actual || "…"}
              </span>
              {done && (
                <span className="text-muted-foreground">
                  {" "}
                  · {t("minilibc.libc")} {expected}{" "}
                  {actual === expected ? "✓" : "✗"}
                </span>
              )}
            </p>
          </div>

          <pre className="max-h-[420px] overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
            {(setup?.program.lines ?? []).map((line, index) => (
              <div
                key={index}
                className={cn(
                  "whitespace-pre rounded px-1",
                  state && !state.done && state.steps > 0 && state.line === index
                    ? "bg-[var(--brand)]/25 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {line || " "}
              </div>
            ))}
          </pre>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {t("minilibc.functionLabel")}
        </span>
        {CASES.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={item.key === caseKey ? "default" : "outline"}
            onClick={() => setCaseKey(item.key)}
          >
            {item.key}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => advance()} disabled={done}>
          <SkipForward className="size-3.5" />
          {t("minilibc.step")}
        </Button>
        <Button
          size="sm"
          variant={playing ? "secondary" : "default"}
          onClick={() => setPlaying((p) => !p)}
          disabled={done}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
          {playing ? t("minilibc.pause") : t("minilibc.run")}
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="size-3.5" />
          {t("minilibc.reset")}
        </Button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
          {t("minilibc.steps")} : {state?.steps ?? 0}
        </span>
      </div>

      <p className="font-mono text-xs text-muted-foreground">{t("minilibc.hint")}</p>
    </div>
  );
}

/** Les octets d'un tampon, avec le curseur des pointeurs qui le visent. */
function MemoryStrip({
  slot,
  state,
}: {
  slot: { text: string; offset: number };
  state: MachineState;
}) {
  const length = slot.text.length + 1;
  const pointers = (["rdi", "rsi"] as const).filter((register) => {
    const at = state.registers[register] - state.base;
    return at >= slot.offset && at < slot.offset + length;
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 font-mono text-[11px]">
      {Array.from({ length }, (_, i) => {
        const byte = state.memory[slot.offset + i];
        const here = pointers.filter(
          (register) => state.registers[register] - state.base === slot.offset + i,
        );
        return (
          <span
            key={i}
            title={here.join(" ")}
            className={cn(
              "flex size-5 items-center justify-center rounded-[2px] border",
              here.length > 0
                ? "border-[var(--brand)] bg-[var(--brand)]/25 text-foreground"
                : "border-border/60 bg-background text-muted-foreground",
            )}
          >
            {byte === 0 ? "\\0" : String.fromCharCode(byte)}
          </span>
        );
      })}
    </div>
  );
}

/** Les registres nommés dans l'instruction en cours. */
function touches(state: MachineState, setup: Setup | null, register: Register): boolean {
  if (!setup || state.steps === 0) return false;
  const line = setup.program.lines[state.line] ?? "";
  return new RegExp(`\\b${register}\\b|\\b${register.replace("r", "")}l\\b|\\b${register}b\\b`).test(
    line.split(";")[0].toLowerCase(),
  );
}

function formatValue(value: number, setup: Setup | null): string {
  if (!setup) return String(value);
  const offset = value - BASE;
  const slot = setup.slots.find(
    (s) => offset >= s.offset && offset <= s.offset + s.text.length,
  );
  if (!slot) return String(value);
  // Un pointeur ne dit rien seul : ce qu'il vise est plus parlant.
  return `0x${value.toString(16)} → "${slot.text.slice(offset - slot.offset)}"`;
}

function argRole(entry: Case, register: Register): string {
  return entry.args.find((a) => a.register === register)?.role ?? "";
}

function describeResult(entry: Case, state: MachineState, setup: Setup | null): string {
  // En cours de route, rax n'est qu'un registre de passage : le lire comme
  // un résultat afficherait des valeurs qui n'en sont pas.
  if (!state.done) return "";
  if (entry.returns === "buffer") {
    const slot = setup?.slots[0];
    if (!slot) return "";
    return Array.from(
      { length: slot.text.length },
      (_, i) => String.fromCharCode(state.memory[slot.offset + i] || 46),
    ).join("");
  }
  if (entry.returns === "pointer") {
    const offset = state.registers.rax - BASE;
    return state.registers.rax === 0 ? "NULL" : String(offset);
  }
  return String(state.registers.rax);
}
