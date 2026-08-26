import { useRef, useState, type FormEvent, type RefObject } from "react";
import { URGENCY_META, fmtMinutes, type Urgency } from "../lib/data";
import { useScramble } from "../lib/hooks";
import { IconArrowRight } from "./Icons";

const URGENCY_ORDER: Urgency[] = ["now", "soon", "later"];
const URGENCY_ACTIVE: Record<Urgency, string> = {
  now: "bg-verm text-paper",
  soon: "bg-cobalt text-paper",
  later: "bg-ink text-paper",
};

export default function Hero({
  inputRef,
  queuedCount,
  doneToday,
  focusTodaySec,
  onAdd,
}: {
  inputRef: RefObject<HTMLInputElement>;
  queuedCount: number;
  doneToday: number;
  focusTodaySec: number;
  onAdd: (title: string, urgency: Urgency) => void;
}) {
  const [title, setTitle] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("soon");
  const [error, setError] = useState(false);

  const line1 = useScramble("STOP PLANNING.", 24);
  const line2 = useScramble("START DOING.", 24);

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) {
      setError(true);
      window.setTimeout(() => setError(false), 450);
      inputRef.current?.focus();
      return;
    }
    onAdd(clean, urgency);
    setTitle("");
    inputRef.current?.focus();
  }

  return (
    <section className="relative overflow-hidden">
      <div className="halftone pointer-events-none absolute -right-8 -top-8 h-56 w-56 opacity-20" />
      <div className="pointer-events-none absolute -left-6 top-1/2 h-40 w-40 rotate-12 border-2 border-verm opacity-30" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-16">
        {/* poster type */}
        <div className="lg:col-span-7">
          <p className="mb-5 inline-flex items-center gap-2 border-2 border-ink bg-sun px-3 py-1 font-mono text-[11px] font-bold tracking-[0.22em]">
            FIELD MANUAL FOR FINISHERS <span aria-hidden>▸</span> VOL. 01
          </p>
          <h1 className="font-display leading-[0.92] tracking-tight">
            <span className="block text-[13.5vw] sm:text-7xl lg:text-[5.6rem] xl:text-[6.4rem]">
              {line1 || "\u00A0"}
            </span>
            <span className="outline-text block text-[13.5vw] sm:text-7xl lg:text-[5.6rem] xl:text-[6.4rem]">
              {line2 || "\u00A0"}
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg font-medium leading-snug text-ink-soft">
            One queue. One task in the ring. One clock.{" "}
            <strong className="text-ink">DO IT</strong> is the board for people who are done
            negotiating with themselves.
          </p>

          {/* live strip */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y-2 border-ink py-3 font-mono text-xs font-semibold tracking-[0.14em] sm:text-[13px]">
            <span>
              <span className="text-verm">■</span> {queuedCount} IN QUEUE
            </span>
            <span aria-hidden className="text-line">
              /
            </span>
            <span>
              <span className="text-grass">■</span> {doneToday} SHIPPED TODAY
            </span>
            <span aria-hidden className="text-line">
              /
            </span>
            <span>
              <span className="text-cobalt">■</span> {fmtMinutes(focusTodaySec)} FOCUSED
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-[11px] tracking-[0.16em] text-ink-dim">
            <span className="flex items-center gap-2">
              PRESS <kbd className="border-2 border-ink bg-card px-2 py-0.5 font-bold text-ink">/</kbd>{" "}
              TO GRAB THE INPUT
            </span>
            <span className="hidden h-4 w-0.5 bg-line sm:block" />
            <span className="flex items-center gap-2">
              THEN <kbd className="border-2 border-ink bg-card px-2 py-0.5 font-bold text-ink">↵</kbd>{" "}
              TO QUEUE IT
            </span>
          </div>
        </div>

        {/* work order card */}
        <div className="lg:col-span-5">
          <div className="relative lg:mt-4">
            <span
              aria-hidden
              className="absolute -right-3 -top-4 z-10 rotate-6 border-2 border-verm bg-paper px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] text-verm"
            >
              60-SECOND RULE: IF IT FITS, DO IT NOW
            </span>
            <form
              onSubmit={submit}
              className={`card-hard relative ${error ? "shake border-verm" : ""}`}
            >
              <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-2.5 text-paper">
                <span className="font-mono text-[11px] font-bold tracking-[0.24em]">
                  WORK ORDER
                </span>
                <span className="font-mono text-[11px] text-sun">Nº {String(1 + queuedCount).padStart(4, "0")}</span>
              </div>

              <div className="p-4 sm:p-5">
                <label
                  htmlFor="work-order-input"
                  className="mb-2 block font-mono text-[11px] font-bold tracking-[0.2em] text-ink-dim"
                >
                  WHAT ARE YOU AVOIDING?
                </label>
                <input
                  ref={inputRef}
                  id="work-order-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. file the invoice, make the call…"
                  autoComplete="off"
                  className={`w-full border-2 bg-paper px-3 py-3 font-body text-base font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-ink-dim/70 focus:bg-card ${
                    error ? "border-verm" : "border-ink"
                  }`}
                />
                <p
                  className={`mt-1.5 font-mono text-[11px] font-bold tracking-wider text-verm transition-opacity ${
                    error ? "opacity-100" : "opacity-0"
                  }`}
                >
                  ▲ EMPTY ORDERS SHIP NOTHING. TYPE THE THING.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-ink-dim">
                    URGENCY
                  </span>
                  <div className="flex gap-1.5">
                    {URGENCY_ORDER.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUrgency(u)}
                        aria-pressed={urgency === u}
                        className={`chip px-3 py-1 font-mono text-[11px] font-bold tracking-wider ${
                          urgency === u
                            ? `${URGENCY_ACTIVE[u]} border-ink`
                            : "border-ink/40 bg-paper text-ink-soft"
                        }`}
                      >
                        {URGENCY_META[u].label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-hard mt-5 flex w-full items-center justify-center gap-2 border-ink bg-verm px-4 py-3.5 font-display text-xl tracking-wide text-paper"
                >
                  ADD TO QUEUE <IconArrowRight width={20} height={20} />
                </button>

                <p className="mt-3 text-center font-mono text-[10px] tracking-[0.18em] text-ink-dim">
                  NO NOTES. NO PLANS. JUST THE NEXT ACTION.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
