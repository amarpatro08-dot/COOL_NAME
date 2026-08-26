import { useEffect, useRef, useState } from "react";
import { PRESET_MIN, fmtClock, type Task } from "../lib/data";
import { useScramble } from "../lib/hooks";
import {
  IconArrowDownRight,
  IconCheck,
  IconPause,
  IconPlay,
  IconTimer,
  IconX,
} from "./Icons";

interface NowDockProps {
  task: Task | null;
  queuedCount: number;
  shippedFlash: number;
  presetMin: number;
  onPreset: (m: number) => void;
  onShip: (focusSec: number) => void;
  onBail: () => void;
  onGotoQueue: () => void;
}

export default function NowDock({
  task,
  queuedCount,
  shippedFlash,
  presetMin,
  onPreset,
  onShip,
  onBail,
  onGotoQueue,
}: NowDockProps) {
  const totalSec = presetMin * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const taskIdRef = useRef<string | null>(null);
  const flashRef = useRef(shippedFlash);

  // reset timer whenever the task in the ring changes
  useEffect(() => {
    const id = task?.id ?? null;
    if (taskIdRef.current !== id) {
      taskIdRef.current = id;
      setRunning(false);
      endAtRef.current = null;
      setRemaining(totalSec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  // keep remaining in sync when the preset changes while idle
  useEffect(() => {
    if (!running && endAtRef.current === null) setRemaining(totalSec);
  }, [totalSec, running]);

  // completion edge: fire exactly once when the clock crosses zero
  useEffect(() => {
    if (remaining <= 0 && running && task) {
      setRunning(false);
      endAtRef.current = null;
      onShip(totalSec);
    }
  }, [remaining, running, task, totalSec, onShip]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const end = endAtRef.current;
      if (end === null) return;
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) window.clearInterval(id);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const scrambledTitle = useScramble(task ? task.title.toUpperCase() : "");
  const justShipped = shippedFlash !== flashRef.current;
  flashRef.current = shippedFlash;

  const elapsed = Math.min(totalSec, Math.max(0, totalSec - remaining));
  const pct = totalSec > 0 ? (elapsed / totalSec) * 100 : 0;
  const urgent = remaining <= 60;

  function toggle() {
    if (!task) return;
    if (running) {
      endAtRef.current = null;
      setRunning(false);
    } else {
      if (remaining <= 0) setRemaining(totalSec);
      endAtRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }

  function shipNow() {
    if (!task) return;
    setRunning(false);
    endAtRef.current = null;
    onShip(Math.max(30, elapsed));
    setRemaining(totalSec);
  }

  function bail() {
    setRunning(false);
    endAtRef.current = null;
    setRemaining(totalSec);
    onBail();
  }

  return (
    <section id="now-dock" className="relative overflow-hidden border-y-2 border-ink bg-ink text-paper">
      <div className="halftone-paper pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-[0.14]" />
      <div
        aria-hidden
        className="outline-paper pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none font-display text-[11rem] leading-none opacity-[0.07] lg:block"
      >
        NOW
      </div>

      {justShipped && (
        <>
          <div className="flash-out pointer-events-none absolute inset-0 z-20 bg-verm" />
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
            <div className="stamp-in border-[6px] border-verm bg-ink/80 px-8 py-4 text-center">
              <span className="block font-display text-5xl tracking-wider text-verm sm:text-7xl">
                SHIPPED
              </span>
              <span className="mt-1 block font-mono text-[11px] font-bold tracking-[0.3em] text-paper">
                ✓ LOGGED TO THE RECORD
              </span>
            </div>
          </div>
        </>
      )}

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
        {/* left: the task in the ring */}
        <div className="lg:col-span-6">
          <p className="flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.26em] text-sun">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                running ? "pulse-dot bg-verm" : task ? "bg-sun" : "bg-ink-dim"
              }`}
            />
            THE NOW DOCK — ONE TASK AT A TIME
          </p>

          {task ? (
            <>
              <h2 className="mt-5 min-h-[3.2em] font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                {scrambledTitle || "\u00A0"}
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold tracking-[0.18em]">
                <span
                  className={`border-2 px-2.5 py-1 ${
                    task.urgency === "now"
                      ? "border-verm bg-verm text-paper"
                      : task.urgency === "soon"
                        ? "border-cobalt bg-cobalt text-paper"
                        : "border-paper/50 text-paper/70"
                  }`}
                >
                  {task.urgency.toUpperCase()}
                </span>
                <span className="text-paper/50">IN THE RING</span>
                <span aria-hidden className="text-paper/30">
                  //
                </span>
                <span className="text-paper/50">{queuedCount} MORE WAITING</span>
              </div>

              <p className="mt-8 max-w-sm border-l-4 border-verm pl-4 text-[15px] leading-relaxed text-paper/75">
                Nothing else exists until the clock stops or the thing ships. Tabs closed.
                Phone face-down. This is the whole job.
              </p>
            </>
          ) : (
            <>
              <div className="mt-5 flex min-h-[7rem] items-center border-2 border-dashed border-paper/30 px-6 py-8">
                <p className="font-display text-3xl leading-tight text-paper/60 sm:text-4xl">
                  NOTHING IN THE RING.
                  <span className="mt-2 block font-mono text-xs font-bold tracking-[0.2em] text-paper/40">
                    GRAB A TASK FROM THE QUEUE AND HIT “DO IT”.
                  </span>
                </p>
              </div>
              <button
                onClick={onGotoQueue}
                className="btn-hard mt-8 inline-flex items-center gap-2 border-paper bg-verm px-5 py-3 font-display text-lg tracking-wide text-paper"
              >
                <IconArrowDownRight width={18} height={18} /> GO PICK A FIGHT
              </button>
            </>
          )}
        </div>

        {/* right: the clock */}
        <div className="lg:col-span-6">
          <div className="relative border-2 border-paper bg-ink p-6 shadow-[8px_8px_0_0_rgba(239,236,226,0.9)] sm:p-8">
            <div className="flex items-center justify-between font-mono text-[11px] font-bold tracking-[0.24em]">
              <span className="flex items-center gap-2 text-paper/60">
                <IconTimer width={15} height={15} /> FOCUS CLOCK
              </span>
              <span className={running ? "text-verm" : "text-paper/40"}>
                {running ? "● RUNNING" : remaining < totalSec && remaining > 0 ? "‖ PAUSED" : "○ ARMED"}
              </span>
            </div>

            <div
              className={`digits mt-4 text-center font-display leading-none ${
                urgent && running ? "text-verm" : "text-paper"
              }`}
              style={{ fontSize: "clamp(5rem, 14vw, 9.5rem)" }}
            >
              {fmtClock(remaining)}
            </div>

            {/* progress bar */}
            <div className="mt-5 h-5 w-full border-2 border-paper bg-ink">
              <div
                className="hazard h-full transition-[width] duration-300 ease-linear"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* presets */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[11px] font-bold tracking-[0.2em] text-paper/50">
                ROUND
              </span>
              {PRESET_MIN.map((m) => (
                <button
                  key={m}
                  onClick={() => onPreset(m)}
                  disabled={running}
                  aria-pressed={presetMin === m}
                  className={`chip digits px-3.5 py-1.5 font-mono text-xs font-bold disabled:opacity-40 ${
                    presetMin === m
                      ? "border-sun bg-sun text-ink"
                      : "border-paper/50 text-paper hover:border-paper"
                  }`}
                >
                  {m}′
                </button>
              ))}
            </div>

            {/* controls */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                onClick={toggle}
                disabled={!task}
                className={`btn-hard col-span-2 flex items-center justify-center gap-2 border-paper px-4 py-3 font-display text-xl tracking-wide ${
                  running ? "bg-sun text-ink" : "bg-verm text-paper"
                }`}
              >
                {running ? (
                  <>
                    <IconPause width={16} height={16} /> PAUSE
                  </>
                ) : (
                  <>
                    <IconPlay width={16} height={16} /> {remaining < totalSec && remaining > 0 ? "RESUME" : "GO"}
                  </>
                )}
              </button>
              <button
                onClick={shipNow}
                disabled={!task}
                title="Done early? Log it and move on."
                className="btn-hard flex items-center justify-center gap-2 border-paper bg-grass px-3 py-3 font-display text-base tracking-wide text-paper"
              >
                <IconCheck width={15} height={15} /> SHIP IT
              </button>
              <button
                onClick={bail}
                disabled={!task}
                title="Send it back to the queue."
                className="btn-hard flex items-center justify-center gap-2 border-paper bg-ink px-3 py-3 font-display text-base tracking-wide text-paper/80"
              >
                <IconX width={15} height={15} /> BAIL
              </button>
            </div>

            <p className="mt-4 text-center font-mono text-[10px] tracking-[0.18em] text-paper/40">
              SHIP EARLY AND WE LOG THE REAL MINUTES. THE RECORD NEVER LIES.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
