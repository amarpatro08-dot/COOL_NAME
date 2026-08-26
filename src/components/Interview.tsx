import { useState } from "react";
import { INTERVIEW_QA } from "../data/interview";
import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";

export function Interview() {
  const ref = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState(0);

  return (
    <section id="interview" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal">
        <Kicker index="08">interview defense</Kicker>
        <SectionTitle
          sub="Ten questions an engineer should expect to face for every major component — answered the way the repository would answer them: specifically, and without inflating what's real."
        >
          If you can't defend it,
          <br />
          it doesn't ship.
        </SectionTitle>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="reveal reveal-d1 sticky top-24 space-y-4">
            <div className="rounded-lg border border-line bg-ink-900/70 p-6">
              <div className="font-display text-5xl font-bold text-cy">10<span className="text-fog-dim">/10</span></div>
              <p className="mt-2 text-[13px] leading-relaxed text-fog">
                questions answered, covering architecture choices, failure modes, measurement method, the hardware
                path, scale, CI, flakes and debugging.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-ink-900/70 p-6">
              <div className="flex items-center gap-2.5">
                <Icon name="pulse" size={15} className="text-pass" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim">the meta-answer</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-fog">
                Every answer reduces to one sentence: <span className="text-paper">"I built the seams where hardware
                would eventually live, made the software side honest, and made every claim auditable in the repo."</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["architecture", "failure modes", "metrics", "hardware path", "scale", "ci/cd", "reliability", "debugging"].map((t) => (
                <Chip key={t} tone="fog">{t}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="space-y-2.5">
            {INTERVIEW_QA.map((qa, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={qa.q}
                  className={`reveal overflow-hidden rounded-lg border transition-all duration-300 ${
                    isOpen ? "border-cy/50 bg-ink-850" : "border-line bg-ink-900/70 hover:border-cy/30"
                  }`}
                  style={{ transitionDelay: `${Math.min(i, 4) * 40}ms` }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className={`font-display text-base font-bold tabular-nums ${isOpen ? "text-cy" : "text-fog-dim"}`}>
                      Q{i + 1}
                    </span>
                    <span className={`flex-1 font-display text-[15px] font-semibold ${isOpen ? "text-paper" : "text-paper/85"}`}>
                      {qa.q}
                    </span>
                    <Chip tone="fog" className="hidden sm:inline-flex">{qa.tag}</Chip>
                    <Icon name="chev" size={13} className={`shrink-0 text-fog-dim transition-transform duration-300 ${isOpen ? "rotate-90 text-cy" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-line-soft px-5 py-4 pl-[60px]">
                        {qa.a.map((p, j) => (
                          <p key={j} className="text-[13.5px] leading-relaxed text-fog">
                            {j === 0 && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cy align-middle" />}
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
