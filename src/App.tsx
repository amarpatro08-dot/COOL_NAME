import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "./components/TopBar";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import NowDock from "./components/NowDock";
import Board from "./components/Board";
import Momentum from "./components/Momentum";
import ExcuseMachine from "./components/ExcuseMachine";
import Footer from "./components/Footer";
import {
  URGENCY_META,
  computeStreak,
  dayKey,
  makeSeedStats,
  makeSeedTasks,
  uid,
  type Stats,
  type Task,
  type Urgency,
} from "./lib/data";
import { usePersistentState } from "./lib/hooks";

export default function App() {
  const [tasks, setTasks] = usePersistentState<Task[]>("doit.tasks.v1", () =>
    makeSeedTasks()
  );
  const [stats, setStats] = usePersistentState<Stats>("doit.stats.v1", () =>
    makeSeedStats()
  );
  const [presetMin, setPresetMin] = usePersistentState<number>(
    "doit.preset.v1",
    25
  );
  const [shippedFlash, setShippedFlash] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the work-order input from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        e.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        !target?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const queued = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "queued")
        .sort(
          (a, b) =>
            URGENCY_META[b.urgency].weight - URGENCY_META[a.urgency].weight ||
            a.createdAt - b.createdAt
        ),
    [tasks]
  );

  const shipped = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "done")
        .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    [tasks]
  );

  const nowTask = useMemo(
    () => tasks.find((t) => t.status === "now") ?? null,
    [tasks]
  );

  const today = stats.days[dayKey(new Date())] ?? { done: 0, focus: 0 };
  const streak = useMemo(() => computeStreak(stats.days), [stats.days]);

  const addTask = useCallback(
    (title: string, urgency: Urgency) => {
      const t: Task = {
        id: uid(),
        title,
        urgency,
        status: "queued",
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, t]);
      setStats((s) => ({ ...s, created: s.created + 1 }));
    },
    [setTasks, setStats]
  );

  const doIt = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "now" as const }
            : t.status === "now"
              ? { ...t, status: "queued" as const }
              : t
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id)),
    [setTasks]
  );

  const bailNow = useCallback(
    () =>
      setTasks((prev) =>
        prev.map((t) => (t.status === "now" ? { ...t, status: "queued" as const } : t))
      ),
    [setTasks]
  );

  const shipNow = useCallback(
    (focusSec: number) => {
      const current = tasks.find((t) => t.status === "now");
      if (!current) return;
      const key = dayKey(new Date());
      setTasks((prev) =>
        prev.map((t) =>
          t.id === current.id
            ? { ...t, status: "done" as const, doneAt: Date.now(), focusSec }
            : t
        )
      );
      setStats((s) => ({
        ...s,
        total: s.total + 1,
        days: {
          ...s.days,
          [key]: {
            done: (s.days[key]?.done ?? 0) + 1,
            focus: (s.days[key]?.focus ?? 0) + focusSec,
          },
        },
      }));
      setShippedFlash((n) => n + 1);
    },
    [tasks, setTasks, setStats]
  );

  const clearShipped = useCallback(
    () => setTasks((prev) => prev.filter((t) => t.status !== "done")),
    [setTasks]
  );

  return (
    <div id="top" className="relative min-h-screen">
      {/* ambient drifting watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <span
          aria-hidden
          className="outline-text drift select-none whitespace-nowrap font-display text-[26vw] leading-none opacity-[0.05]"
        >
          DO IT
        </span>
      </div>
      <div className="noise-layer" />

      <div className="relative z-10">
        <TopBar streak={streak} />
        <main>
          <Hero
            inputRef={inputRef}
            queuedCount={queued.length}
            doneToday={today.done}
            focusTodaySec={today.focus}
            onAdd={addTask}
          />
          <Ticker />
          <NowDock
            task={nowTask}
            queuedCount={queued.length}
            shippedFlash={shippedFlash}
            presetMin={presetMin}
            onPreset={setPresetMin}
            onShip={shipNow}
            onBail={bailNow}
            onGotoQueue={() =>
              document.getElementById("queue")?.scrollIntoView({ block: "start" })
            }
          />
          <Board
            queued={queued}
            shipped={shipped}
            onDoIt={doIt}
            onDelete={deleteTask}
            onClearShipped={clearShipped}
          />
          <Ticker reverse />
          <Momentum
            days={stats.days}
            doneToday={today.done}
            focusTodaySec={today.focus}
            streak={streak}
            total={stats.total}
          />
          <ExcuseMachine />
        </main>
        <Footer />
      </div>
    </div>
  );
}
