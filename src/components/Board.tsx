import {
  URGENCY_META,
  fmtTimeOfDay,
  type Task,
  type Urgency,
} from "../lib/data";
import Reveal from "./Reveal";
import { IconBolt, IconCheckSquare, IconTrash } from "./Icons";

const URGENCY_STYLE: Record<Urgency, string> = {
  now: "bg-verm text-paper",
  soon: "bg-cobalt text-paper",
  later: "bg-paper-2 text-ink-soft",
};

function waitLabel(createdAt: number): string {
  const min = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
  if (min < 1) return "JUST NOW";
  if (min < 60) return `WAITING ${min}M`;
  const h = Math.floor(min / 60);
  if (h < 24) return `WAITING ${h}H ${min % 60}M`;
  return `WAITING ${Math.floor(h / 24)}D`;
}

export default function Board({
  queued,
  shipped,
  onDoIt,
  onDelete,
  onClearShipped,
}: {
  queued: Task[];
  shipped: Task[];
  onDoIt: (id: string) => void;
  onDelete: (id: string) => void;
  onClearShipped: () => void;
}) {
  const recent = shipped.slice(0, 8);

  return (
    <section id="queue" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.26em] text-verm">
              SECTION 02 — THE BOARD
            </p>
            <h2 className="mt-2 font-display text-5xl tracking-tight sm:text-6xl">
              THE QUEUE<span className="text-verm">.</span>
            </h2>
          </div>
          <p className="max-w-xs border-l-4 border-ink pl-4 font-mono text-xs leading-relaxed text-ink-soft">
            Sorted by heat, then by age. Oldest fires burn first — that's the deal.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* ---------- queue ---------- */}
        <Reveal className="lg:col-span-3" delay={60}>
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <h3 className="font-display text-2xl tracking-wide">
              QUEUED <span className="text-ink-dim">({queued.length})</span>
            </h3>
            <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-ink-dim">
              NEXT UP AT THE TOP
            </span>
          </div>

          {queued.length === 0 ? (
            <div className="mt-6 border-2 border-dashed border-ink/40 px-6 py-12 text-center">
              <p className="font-display text-3xl text-ink-soft">QUEUE CLEAR.</p>
              <p className="mt-2 font-mono text-xs tracking-[0.16em] text-ink-dim">
                DANGEROUS. GO FIND THE NEXT THING AND QUEUE IT.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {queued.map((t, i) => (
                <li key={t.id} className="pop-in">
                  <div className="group flex items-center gap-3 border-2 border-ink bg-card p-3 shadow-[4px_4px_0_0_var(--color-ink)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 sm:gap-4 sm:p-4">
                    <span className="digits hidden w-8 shrink-0 font-mono text-sm font-bold text-ink-dim sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-snug sm:text-base sm:leading-normal sm:whitespace-normal">
                        {t.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.16em] ${URGENCY_STYLE[t.urgency]}`}
                        >
                          {URGENCY_META[t.urgency].label}
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-dim">
                          {waitLabel(t.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(t.id)}
                      title="Scrap this order"
                      aria-label={`Delete task: ${t.title}`}
                      className="chip shrink-0 border-ink/30 p-2 text-ink-dim hover:border-verm hover:text-verm"
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                    <button
                      onClick={() => onDoIt(t.id)}
                      className="btn-hard flex shrink-0 items-center gap-1.5 border-ink bg-verm px-3.5 py-2.5 font-display text-base tracking-wide text-paper"
                    >
                      <IconBolt width={14} height={14} /> DO IT
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* ---------- shipped ---------- */}
        <Reveal className="lg:col-span-2" delay={140}>
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <h3 className="font-display text-2xl tracking-wide">
              SHIPPED <span className="text-grass">({shipped.length})</span>
            </h3>
            {shipped.length > 0 && (
              <button
                onClick={onClearShipped}
                className="font-mono text-[10px] font-bold tracking-[0.18em] text-ink-dim underline decoration-2 underline-offset-4 transition-colors hover:text-verm"
              >
                CLEAR LOG
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="mt-6 border-2 border-dashed border-ink/40 px-6 py-12 text-center">
              <p className="font-display text-2xl text-ink-soft">NOTHING YET.</p>
              <p className="mt-2 font-mono text-xs tracking-[0.16em] text-ink-dim">
                THE STAMP IS WARM AND WAITING.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 border-2 border-ink/70 bg-paper-2/70 p-3 transition-colors hover:bg-paper-2"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center border-2 border-grass bg-grass text-paper">
                    <IconCheckSquare width={14} height={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-soft line-through decoration-2 decoration-grass/70">
                      {t.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-ink-dim">
                      {t.doneAt ? fmtTimeOfDay(t.doneAt) : "--:--"}
                      {t.focusSec ? ` · ${Math.max(1, Math.round(t.focusSec / 60))} MIN FOCUS` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {shipped.length > 0 && (
            <p className="mt-4 border-l-4 border-grass pl-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              EVERY ITEM HERE USED TO BE AN EXCUSE.
              {shipped.length >= 8 ? " SHOWING THE LAST 8." : ""}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
