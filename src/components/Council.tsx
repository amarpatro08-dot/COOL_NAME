import { useState } from "react";
import { COUNCIL_DECISIONS, COUNCIL_PHASE3, FINAL_REVIEW_WEAKNESSES } from "../data/council";
import { Chip, Icon, Kicker, SectionTitle, SeverityChip, useReveal } from "../lib/ui";

export function Council() {
  const ref = useReveal<HTMLDivElement>();
  const [openMember, setOpenMember] = useState<number>(1);
  const [openWeakness, setOpenWeakness] = useState<number>(0);

  return (
    <section id="council" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal">
        <Kicker index="06">ai council review</Kicker>
        <SectionTitle
          sub="Before architecture froze, seven adversarial roles attacked it — each with a recommendation, a concern, a severity and a proposed fix. Conclusions only; the disagreements are the point."
        >
          Seven reviewers,
          <br />
          zero yes-men.
        </SectionTitle>
      </div>

      {/* phase 3 opinions */}
      <div className="reveal reveal-d1 mt-12 grid gap-3 md:grid-cols-2">
        {COUNCIL_PHASE3.map((m, i) => {
          const open = openMember === i;
          return (
            <button
              key={m.member}
              onClick={() => setOpenMember(open ? -1 : i)}
              className={`group rounded-lg border p-5 text-left transition-all duration-300 ${
                open ? "border-cy/50 bg-ink-850 shadow-[0_10px_40px_-20px_rgba(88,199,243,0.3)]" : "border-line bg-ink-900/70 hover:border-cy/30 hover:bg-ink-850"
              } ${i === COUNCIL_PHASE3.length - 1 ? "md:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-[15px] font-bold text-paper">{m.member}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">{m.role}</div>
                </div>
                <SeverityChip level={m.severity} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-fog">
                <span className="font-mono text-[10px] uppercase tracking-wider text-pass">rec · </span>
                {m.recommendation}
              </p>
              <div className={`grid transition-all duration-300 ${open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="space-y-2.5 border-t border-line-soft pt-3">
                    <p className="text-[12.5px] leading-relaxed text-fog">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-fail">concern · </span>
                      {m.concern}
                    </p>
                    <p className="text-[12.5px] leading-relaxed text-fog">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-cy">fix · </span>
                      {m.improvement}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-fog-dim">
                <Icon name="chev" size={10} className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
                {open ? "collapse" : "concern + fix"}
              </div>
            </button>
          );
        })}
      </div>

      {/* decisions */}
      <div className="reveal reveal-d2 mt-12 rounded-lg border border-line bg-ink-900/70 p-6 sm:p-8">
        <h3 className="font-display text-xl font-bold text-paper">Final decisions — Phase 3</h3>
        <div className="mt-5 space-y-4">
          {COUNCIL_DECISIONS.map((d, i) => (
            <div key={i} className="grid gap-2 border-l-2 border-cy/50 pl-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-6">
              <p className="text-[13.5px] font-medium leading-snug text-paper">
                <span className="mr-2 font-mono text-[11px] text-cy">D{i + 1}</span>
                {d.decision}
              </p>
              <p className="text-[12.5px] leading-relaxed text-fog">{d.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* hostile final review */}
      <div className="reveal reveal-d2 mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-paper">Hostile final review</h3>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-fog">
              The council's last act was to try to kill the project's credibility. These are the ten weaknesses it left
              standing in the record — ranked, severity-tagged, and each with the mitigation that earns its keep.
            </p>
          </div>
          <Chip tone="fail">10 open weaknesses</Chip>
        </div>

        <div className="mt-7 overflow-hidden rounded-lg border border-line">
          {FINAL_REVIEW_WEAKNESSES.map((w, i) => {
            const open = openWeakness === i;
            return (
              <div key={w.rank} className={i > 0 ? "border-t border-line-soft" : ""}>
                <button
                  onClick={() => setOpenWeakness(open ? -1 : i)}
                  className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-200 ${open ? "bg-ink-850" : "bg-ink-900/60 hover:bg-ink-850"}`}
                >
                  <span className={`w-8 shrink-0 font-display text-lg font-bold tabular-nums ${w.rank <= 2 ? "text-fail" : w.rank <= 5 ? "text-warn" : "text-fog-dim"}`}>
                    {String(w.rank).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-paper/90">{w.title}</span>
                  <SeverityChip level={w.severity} />
                  <Icon name="chev" size={12} className={`shrink-0 text-fog-dim transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="grid gap-4 bg-ink-950/50 px-5 py-4 pl-[68px] sm:grid-cols-2">
                      <p className="text-[12.5px] leading-relaxed text-fog">{w.detail}</p>
                      <p className="text-[12.5px] leading-relaxed text-fog">
                        <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wider text-pass">mitigation</span>
                        {w.mitigation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
