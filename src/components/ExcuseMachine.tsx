import { useEffect, useRef, useState } from "react";
import { EXCUSES } from "../lib/data";
import { usePrefersReducedMotion } from "../lib/hooks";
import Reveal from "./Reveal";
import { IconBolt } from "./Icons";

export default function ExcuseMachine() {
  const reduced = usePrefersReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [shredded, setShredded] = useState(0);
  const timerRef = useRef<number | null>(null);

  function run(idx: number) {
    setActiveIdx(idx);
    setShredded((n) => n + 1);
    const full = EXCUSES[idx].comeback;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (reduced) {
      setTyped(full);
      return;
    }
    setTyped("");
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length && timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 22);
  }

  function random() {
    let idx = Math.floor(Math.random() * EXCUSES.length);
    if (idx === activeIdx) idx = (idx + 1) % EXCUSES.length;
    run(idx);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const stillTyping =
    activeIdx !== null && typed.length < EXCUSES[activeIdx].comeback.length;

  return (
    <section className="relative border-y-2 border-ink bg-paper-2/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-bold tracking-[0.26em] text-verm">
                SECTION 04 — THE SHREDDER
              </p>
              <h2 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">
                EXCUSES, SHREDDED<span className="text-verm">.</span>
              </h2>
            </div>
            <p className="max-w-xs border-l-4 border-ink pl-4 font-mono text-xs leading-relaxed text-ink-soft">
              Pick the line you were about to tell yourself. Get read for filth.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-5" delay={60}>
            <p className="mb-3 font-mono text-[11px] font-bold tracking-[0.22em] text-ink-dim">
              TODAY'S MENU OF SELF-SABOTAGE:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {EXCUSES.map((ex, i) => (
                <button
                  key={ex.excuse}
                  onClick={() => run(i)}
                  aria-pressed={activeIdx === i}
                  className={`chip border-ink px-3.5 py-2 text-left font-mono text-xs font-bold ${
                    activeIdx === i
                      ? "bg-verm text-paper"
                      : "bg-card text-ink-soft hover:text-ink"
                  }`}
                >
                  “{ex.excuse}”
                </button>
              ))}
            </div>

            <button
              onClick={random}
              className="btn-hard mt-6 inline-flex items-center gap-2 border-ink bg-sun px-5 py-3 font-display text-lg tracking-wide text-ink"
            >
              <IconBolt width={16} height={16} /> FEED ME A RANDOM ONE
            </button>

            <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-ink-dim">
              EXCUSES SHREDDED THIS SESSION:{" "}
              <span className="digits font-bold text-verm">{shredded}</span>
            </p>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={140}>
            <div className="hard-shadow flex h-full flex-col border-2 border-ink bg-ink text-paper">
              <div className="flex items-center justify-between border-b-2 border-paper/20 px-4 py-2.5">
                <span className="font-mono text-[11px] font-bold tracking-[0.22em] text-paper/60">
                  COMEBACK TERMINAL v2.6
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 bg-verm ${stillTyping ? "pulse-dot" : ""}`} />
                  <span className="h-2.5 w-2.5 bg-sun" />
                  <span className="h-2.5 w-2.5 bg-grass" />
                </span>
              </div>

              <div className="flex-1 p-5 font-mono sm:p-7">
                {activeIdx === null ? (
                  <p className="text-sm leading-relaxed text-paper/50">
                    &gt; SYSTEM IDLE. AWAITING EXCUSE INPUT<span className="blink">▌</span>
                    <br />
                    &gt; WARNING: UNIT IS FULLY CHARGED AND SLIGHTLY JUDGMENTAL.
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-bold tracking-[0.14em] text-verm">
                      &gt; EXCUSE RECEIVED: “{EXCUSES[activeIdx].excuse.toUpperCase()}”
                    </p>
                    <p className="mt-1 text-xs tracking-[0.14em] text-paper/40">
                      &gt; SHREDDING… VERDICT:
                    </p>
                    <p className="mt-4 text-base font-semibold leading-relaxed text-paper sm:text-lg">
                      {typed}
                      <span className={`text-acid ${stillTyping ? "" : "blink"}`}>▌</span>
                    </p>
                  </>
                )}
              </div>

              <div className="border-t-2 border-paper/20 px-4 py-2.5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-paper/40">
                  TIP: THE FEEDBACK IS RUDE BECAUSE THE EXCUSE IS LYING.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
