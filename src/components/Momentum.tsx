import {
  DAILY_TARGET,
  dayKey,
  lastNDays,
  type DayStats,
} from "../lib/data";
import Reveal from "./Reveal";
import { IconFlame, IconTarget, IconTimer } from "./Icons";

function fmtHM(sec: number): string {
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}H ${m}M` : `${m}M`;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function Momentum({
  days,
  doneToday,
  focusTodaySec,
  streak,
  total,
}: {
  days: Record<string, DayStats>;
  doneToday: number;
  focusTodaySec: number;
  streak: number;
  total: number;
}) {
  const history = lastNDays(14);
  const maxDone = Math.max(1, ...history.map((d) => days[dayKey(d)]?.done ?? 0));
  const targetPct = Math.min(100, Math.round((doneToday / DAILY_TARGET) * 100));

  return (
    <section id="record" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.26em] text-verm">
              SECTION 03 — THE RECORD
            </p>
            <h2 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">
              PAPER TRAIL<span className="text-verm">.</span>
            </h2>
          </div>
          <p className="max-w-xs border-l-4 border-ink pl-4 font-mono text-xs leading-relaxed text-ink-soft">
            Feelings lie. The ledger doesn't. Everything below is timer-verified.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* big today card */}
        <Reveal className="lg:col-span-5" delay={40}>
          <div className="hard-shadow relative h-full overflow-hidden border-2 border-ink bg-cobalt p-6 text-paper sm:p-8">
            <div className="halftone-paper pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-20" />
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.24em] text-paper/70">
              <IconTarget width={15} height={15} /> SHIPPED TODAY
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className="digits font-display text-[7rem] leading-[0.85] sm:text-[8.5rem]">
                {doneToday}
              </span>
              <span className="mb-2 font-display text-3xl text-paper/60">/ {DAILY_TARGET}</span>
            </div>
            <div className="mt-5 h-4 w-full border-2 border-paper bg-cobalt-deep">
              <div
                className="h-full bg-acid transition-[width] duration-500"
                style={{ width: `${targetPct}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] font-bold tracking-[0.18em] text-paper/80">
              {doneToday >= DAILY_TARGET
                ? "TARGET MET. ANYTHING MORE IS A FLEX."
                : `${DAILY_TARGET - doneToday} MORE TO CLOSE THE DAY.`}
            </p>
          </div>
        </Reveal>

        {/* right column stack */}
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
          <Reveal delay={100}>
            <div className="hard-shadow h-full border-2 border-ink bg-card p-6">
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.24em] text-ink-dim">
                <IconTimer width={15} height={15} /> FOCUS TODAY
              </p>
              <p className="digits mt-3 font-display text-6xl leading-none sm:text-7xl">
                {fmtHM(focusTodaySec)}
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-ink-soft">
                CLOCK-VERIFIED. NO ROUNDING UP.
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="hard-shadow relative h-full overflow-hidden border-2 border-ink bg-verm p-6 text-paper">
              <IconFlame
                width={120}
                height={120}
                className="pointer-events-none absolute -bottom-5 -right-5 opacity-20"
              />
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.24em] text-paper/75">
                <IconFlame width={15} height={15} /> STREAK
              </p>
              <p className="digits mt-3 font-display text-6xl leading-none sm:text-7xl">
                {streak}
                <span className="ml-2 text-2xl text-paper/70">DAYS</span>
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-paper/85">
                {streak === 0
                  ? "COLD. ONE SHIP RESTARTS THE FIRE."
                  : "BACK-TO-BACK. DON'T BREAK IT."}
              </p>
            </div>
          </Reveal>

          <Reveal className="sm:col-span-2" delay={220}>
            <div className="hard-shadow flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-ink p-6 text-paper">
              <div>
                <p className="font-mono text-[11px] font-bold tracking-[0.24em] text-paper/60">
                  ALL-TIME SHIPPED
                </p>
                <p className="digits mt-2 font-display text-6xl leading-none sm:text-7xl">
                  {total}
                </p>
              </div>
              <div className="max-w-[16rem] border-l-2 border-paper/20 pl-4">
                <p className="font-mono text-[11px] leading-relaxed tracking-[0.12em] text-paper/70">
                  TASKS CLOSED SINCE THIS BOARD OPENED. EACH ONE WAS A SMALL WAR YOU WON.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* heatmap */}
      <Reveal delay={120}>
        <div className="hard-shadow mt-6 border-2 border-ink bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl tracking-wide">LAST 14 DAYS</h3>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.18em] text-ink-dim">
              LESS
              {[0, 1, 2, 3, 4].map((lvl) => (
                <span
                  key={lvl}
                  className="h-3.5 w-3.5 border border-ink/40"
                  style={{
                    background:
                      lvl === 0
                        ? "var(--color-paper)"
                        : `color-mix(in srgb, var(--color-grass) ${lvl * 25}%, var(--color-paper))`,
                  }}
                />
              ))}
              MORE
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-14 sm:gap-2.5">
            {history.map((d) => {
              const st = days[dayKey(d)];
              const n = st?.done ?? 0;
              const lvl = Math.min(4, n);
              const isToday = dayKey(d) === dayKey(new Date());
              return (
                <div key={d.toISOString()} className="flex flex-col items-center gap-1.5">
                  <div
                    title={`${d.toDateString()} — ${n} shipped · ${fmtHM(st?.focus ?? 0)} focused`}
                    className={`grid h-9 w-full place-items-center border-2 transition-transform hover:scale-110 sm:h-11 ${
                      isToday ? "border-verm" : "border-ink/50"
                    }`}
                    style={{
                      background:
                        lvl === 0
                          ? "var(--color-paper-2)"
                          : `color-mix(in srgb, var(--color-grass) ${lvl * 25}%, var(--color-paper))`,
                    }}
                  >
                    <span
                      className={`digits font-mono text-[11px] font-bold ${
                        lvl >= 3 ? "text-paper" : "text-ink-soft"
                      }`}
                    >
                      {n > 0 ? n : ""}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-ink-dim">
                    {WEEKDAYS[d.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-5 border-t-2 border-ink/15 pt-4 font-mono text-[11px] tracking-[0.14em] text-ink-dim">
            PEAK DAY: {maxDone} SHIPPED {maxDone > 1 ? "TASKS" : "TASK"} · TODAY IS{" "}
            <span className="font-bold text-verm">STILL WRITABLE</span>
            <span className="blink">▌</span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
