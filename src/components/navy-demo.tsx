"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavyBoard, parseBoard } from "@/components/navy-board";
import { usePrefs } from "@/lib/prefs";
import { LAYOUTS, loadLayout, openSide, type NavySide } from "@/lib/navy-worker";
import { cn } from "@/lib/utils";

type Mode = "local" | "online";
type Entry = { side: 0 | 1; coord: string; answer: string; train: string };

const POLL_MS = 1500;

/** Une salve, rendue lisible : « ⚡×3 · ×7 » plutôt que vingt chiffres. */
function describeTrain(train: string): string {
  const letter = train.slice(0, 10);
  const digit = train.slice(10);
  const count = (part: string) => part.split("").filter((c) => c === "1").length;
  return `SIGUSR1×${count(letter)} + SIGUSR1×${count(digit)}`;
}

/**
 * Démo de My navy compilé en WebAssembly.
 *
 * Le jeu natif est fait de deux processus qui se tirent dessus à coups de
 * SIGUSR1 et SIGUSR2. Ici, chaque camp est une instance du module dans son
 * propre worker, et la salve de signaux — encodée et décodée par le code du
 * dépôt, à l'identique — passe soit d'un worker à l'autre (partie locale,
 * les deux grilles côte à côte), soit par /api/navy (partie en ligne, deux
 * navigateurs qui se retrouvent sur un code de salon).
 *
 * Personne n'héberge de serveur de jeu : en ligne, le site garde les coups
 * en mémoire le temps de la partie et les rend à qui les redemande.
 */
export function NavyDemo() {
  const { t, lang } = usePrefs();
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("local");

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border bg-card">
        <div className="min-h-[360px] w-full p-4">
          {started ? (
            mode === "local" ? (
              <LocalGame />
            ) : (
              <OnlineGame />
            )
          ) : (
            <div className="flex min-h-[328px] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="max-w-md text-sm text-balance text-muted-foreground">
                {t("navy.intro")}
              </p>
              <Button onClick={() => setStarted(true)}>
                <Play className="size-4 fill-current" />
                {t("navy.launch")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">{t("navy.modeLabel")}</span>
          <Button
            size="sm"
            variant={mode === "local" ? "default" : "outline"}
            onClick={() => setMode("local")}
          >
            {t("navy.modeLocal")}
          </Button>
          <Button
            size="sm"
            variant={mode === "online" ? "default" : "outline"}
            onClick={() => setMode("online")}
          >
            {t("navy.modeOnline")}
          </Button>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {lang === "fr" ? "A1 → H8" : "A1 → H8"}
          </span>
        </div>
      )}

      {started && (
        <p className="font-mono text-xs text-muted-foreground">
          {mode === "local" ? t("navy.hintLocal") : t("navy.hintOnline")}
        </p>
      )}
    </div>
  );
}

/** Journal commun aux deux modes : la salve, puis le résultat. */
function Log({ entries, labels }: { entries: Entry[]; labels: [string, string] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="max-h-28 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted-foreground">
      {entries
        .slice()
        .reverse()
        .map((entry, i) => (
          <li key={entries.length - i}>
            <span className="text-foreground">{labels[entry.side]}</span> {entry.coord}{" "}
            <span className="opacity-60">({describeTrain(entry.train)})</span> → {entry.answer}
          </li>
        ))}
    </ul>
  );
}

// ---------------------------------------------------------------- en local

function LocalGame() {
  const { t } = usePrefs();
  const [boards, setBoards] = useState<{ own: string; enemy: string }[] | null>(null);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [log, setLog] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const sidesRef = useRef<NavySide[]>([]);

  // Rejouer, c'est repartir de deux modules neufs : plutôt qu'une fonction
  // de remise à zéro, le bouton incrémente ce compteur et l'effet refait
  // la mise en place.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let alive = true;
    const sides = [openSide(), openSide()];
    sidesRef.current = sides;

    // Deux flottes différentes : sans cela les deux grilles seraient le
    // même dessin, et la partie perdrait tout son sel.
    Promise.all([loadLayout(LAYOUTS[0]), loadLayout(LAYOUTS[1])])
      .then((layouts) =>
        Promise.all(sides.map((side, i) => side.ask({ type: "init", layout: layouts[i] }))),
      )
      .then((ready) => {
        if (!alive) return;
        setBoards(ready.map((r) => ({ own: r.own ?? "", enemy: r.enemy ?? "" })));
        setTurn(0);
        setWinner(null);
        setLog([]);
      });

    return () => {
      alive = false;
      sides.forEach((side) => side.close());
      sidesRef.current = [];
    };
  }, [generation]);

  const fire = async (side: 0 | 1, coord: string) => {
    if (busy || winner !== null || side !== turn) return;
    const sides = sidesRef.current;
    if (sides.length !== 2) return;
    setBusy(true);

    const fired = await sides[side].ask({ type: "fire", coord });
    if (!fired.train) {
      setBusy(false);
      return;
    }
    // La salve part telle quelle chez l'adversaire, qui la décode signal
    // par signal comme le ferait son gestionnaire de signaux.
    const answered = await sides[1 - side].ask({ type: "incoming", train: fired.train });
    if (answered.type !== "answered") {
      setBusy(false);
      return;
    }
    const resolved = await sides[side].ask({ type: "answer", answer: answered.answer });

    setBoards((current) => {
      if (!current) return current;
      const next = [...current];
      next[side] = { own: resolved.own ?? "", enemy: resolved.enemy ?? "" };
      next[1 - side] = { own: answered.own ?? "", enemy: answered.enemy ?? "" };
      return next;
    });
    setLog((entries) => [
      ...entries,
      { side, coord: answered.coord ?? coord, answer: answered.answer ?? "?", train: fired.train! },
    ]);
    if (resolved.won) setWinner(side);
    else setTurn((1 - side) as 0 | 1);
    setBusy(false);
  };

  if (!boards) return <p className="font-mono text-xs text-muted-foreground">…</p>;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {([0, 1] as const).map((side) => (
          <div
            key={side}
            className={cn(
              "space-y-2 rounded-lg border p-3",
              turn === side && winner === null ? "border-[var(--brand)]" : "border-border",
            )}
          >
            <p className="font-mono text-xs">
              {t("navy.player")} {side + 1}
              {winner === side && ` — ${t("navy.won")}`}
              {winner === null && turn === side && ` — ${t("navy.yourTurn")}`}
            </p>
            <div className="flex flex-wrap gap-3">
              <NavyBoard cells={parseBoard(boards[side].own)} title={t("navy.fleet")} />
              <NavyBoard
                cells={parseBoard(boards[side].enemy)}
                hideShips
                title={t("navy.shots")}
                disabled={busy || winner !== null || turn !== side}
                onFire={(coord) => fire(side, coord)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3">
        <Button size="sm" variant="outline" onClick={() => setGeneration((g) => g + 1)}>
          <RotateCcw className="size-3.5" />
          {t("navy.restart")}
        </Button>
        <Log entries={log} labels={[`${t("navy.player")} 1`, `${t("navy.player")} 2`]} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------- en ligne

type OnlineState = "idle" | "creating" | "waiting" | "playing" | "unavailable";

function OnlineGame() {
  const { t } = usePrefs();
  const [state, setState] = useState<OnlineState>("idle");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [side, setSide] = useState<"host" | "guest">("host");
  const [boards, setBoards] = useState<{ own: string; enemy: string } | null>(null);
  const [myTurn, setMyTurn] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  const [winner, setWinner] = useState<"me" | "them" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sideRef = useRef<NavySide | null>(null);
  const tokenRef = useRef("");
  const lastIdRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      sideRef.current?.close();
      sideRef.current = null;
    };
  }, []);

  const openLobby = async (action: "create" | "join") => {
    setError(null);
    setState("creating");
    // L'hôte prend la première flotte, l'invité la deuxième : deux grilles
    // différentes sans avoir à s'accorder sur quoi que ce soit.
    const layout = await loadLayout(action === "create" ? LAYOUTS[0] : LAYOUTS[1]);
    const response = await fetch("/api/navy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, layout, code: joinCode.toUpperCase() }),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, string>;

    if (!response.ok) {
      if (data.error === "too-many-lobbies") {
        setState("unavailable");
        return;
      }
      setError(data.error ?? "error");
      setState("idle");
      return;
    }

    tokenRef.current = data.token;
    setCode(data.code);
    setSide(data.side as "host" | "guest");

    sideRef.current?.close();
    sideRef.current = openSide();
    const ready = await sideRef.current.ask({ type: "init", layout });
    setBoards({ own: ready.own ?? "", enemy: ready.enemy ?? "" });
    setLog([]);
    setWinner(null);
    lastIdRef.current = 0;
    // L'hôte ouvre le feu ; l'invité attend, comme le joueur 2 du jeu
    // natif attend la poignée de main du joueur 1.
    setMyTurn(data.side === "host");
    setState(data.side === "host" ? "waiting" : "playing");
  };

  /** Rejoue les coups déposés par l'adversaire depuis la dernière fois. */
  const poll = useCallback(async () => {
    if (!code || busyRef.current || !sideRef.current) return;
    const response = await fetch(
      `/api/navy/${code}?since=${lastIdRef.current}&token=${tokenRef.current}`,
    );
    if (!response.ok) return;
    const data = (await response.json()) as {
      opponentJoined: boolean;
      moves: { id: number; side: string; kind: string; payload: string }[];
    };

    if (data.opponentJoined) setState((s) => (s === "waiting" ? "playing" : s));

    for (const move of data.moves) {
      lastIdRef.current = Math.max(lastIdRef.current, move.id);
      if (move.side === side) continue;

      if (move.kind === "fire") {
        const answered = await sideRef.current.ask({ type: "incoming", train: move.payload });
        if (answered.type !== "answered") continue;
        await fetch(`/api/navy/${code}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            kind: "answer",
            payload: answered.answer,
          }),
        });
        setBoards({ own: answered.own ?? "", enemy: answered.enemy ?? "" });
        setLog((entries) => [
          ...entries,
          {
            side: 1,
            coord: answered.coord ?? "??",
            answer: answered.answer ?? "?",
            train: move.payload,
          },
        ]);
        if (answered.answer === "sunk") setWinner("them");
        else setMyTurn(true);
      }

      if (move.kind === "answer") {
        const resolved = await sideRef.current.ask({ type: "answer", answer: move.payload });
        setBoards({ own: resolved.own ?? "", enemy: resolved.enemy ?? "" });
        setLog((entries) => {
          const last = entries[entries.length - 1];
          if (!last || last.side !== 0 || last.answer !== "…") return entries;
          return [...entries.slice(0, -1), { ...last, answer: move.payload }];
        });
        if (resolved.won) setWinner("me");
      }
    }
  }, [code, side]);

  useEffect(() => {
    if (state !== "playing" && state !== "waiting") return;
    const timer = setInterval(poll, POLL_MS);
    poll();
    return () => clearInterval(timer);
  }, [state, poll]);

  const fire = async (coord: string) => {
    if (!myTurn || winner || !sideRef.current) return;
    busyRef.current = true;
    const fired = await sideRef.current.ask({ type: "fire", coord });
    if (!fired.train) {
      busyRef.current = false;
      return;
    }
    await fetch(`/api/navy/${code}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: tokenRef.current, kind: "fire", payload: fired.train }),
    });
    setLog((entries) => [...entries, { side: 0, coord, answer: "…", train: fired.train! }]);
    setMyTurn(false);
    busyRef.current = false;
  };

  if (state === "unavailable") {
    return (
      <p className="max-w-md font-mono text-xs text-muted-foreground">
        {t("navy.noServer")}
      </p>
    );
  }

  if (state === "idle" || state === "creating") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="max-w-md text-sm text-muted-foreground">{t("navy.lobbyIntro")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={state === "creating"} onClick={() => openLobby("create")}>
            {t("navy.create")}
          </Button>
          <span className="font-mono text-xs text-muted-foreground">{t("navy.or")}</span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder={t("navy.codePlaceholder")}
            className="w-28 rounded-md border bg-background px-2 py-1 font-mono text-xs uppercase"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={joinCode.length !== 5 || state === "creating"}
            onClick={() => openLobby("join")}
          >
            {t("navy.join")}
          </Button>
        </div>
        {error && <p className="font-mono text-xs text-destructive">{t("navy.lobbyError")}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs">
        {t("navy.code")} <span className="text-[var(--brand)]">{code}</span> ·{" "}
        {side === "host" ? t("navy.host") : t("navy.guest")}
        {state === "waiting" && ` — ${t("navy.waitingOpponent")}`}
        {winner === "me" && ` — ${t("navy.won")}`}
        {winner === "them" && ` — ${t("navy.lost")}`}
        {!winner && state === "playing" && (myTurn ? ` — ${t("navy.yourTurn")}` : ` — ${t("navy.theirTurn")}`)}
      </p>
      {boards && (
        <div className="flex flex-wrap gap-4">
          <NavyBoard cells={parseBoard(boards.own)} title={t("navy.fleet")} />
          <NavyBoard
            cells={parseBoard(boards.enemy)}
            hideShips
            title={t("navy.shots")}
            disabled={!myTurn || winner !== null || state !== "playing"}
            onFire={fire}
          />
        </div>
      )}
      <Log entries={log} labels={[t("navy.me"), t("navy.them")]} />
    </div>
  );
}
