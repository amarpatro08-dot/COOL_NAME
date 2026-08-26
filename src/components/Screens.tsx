import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";

const SHOTS = [
  {
    src: "https://image.qwenlm.ai/generated-images/d62605b8-420f-410b-821e-c2d7c7201118/_result.png",
    file: "docs/img/console.png",
    url: "nettest.local — #console",
    title: "The lab console",
    caption: "Streaming JSON logs beside the live fabric view — run suites, inject faults, inspect results, download the artifact.",
    wide: true,
  },
  {
    src: "https://image.qwenlm.ai/generated-images/d34e61c1-722d-467d-b462-502642897907/_result.png",
    file: "docs/img/code.png",
    url: "nettest.local — #code",
    title: "The code explorer",
    caption: "All 24 files CI executes, syntax-highlighted and browsable. No hidden glue.",
    wide: false,
  },
  {
    src: "https://image.qwenlm.ai/generated-images/abbfb8e5-bc01-4c48-845a-d4649ba37856/_result.png",
    file: "docs/img/council.png",
    url: "nettest.local — #council",
    title: "The council review",
    caption: "Seven adversarial reviewers, five frozen decisions, and the ranked weakness ledger.",
    wide: false,
  },
];

export function Screens() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="shots" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="09">straight from the readme</Kicker>
          <SectionTitle
            sub="The README ships with screenshots captured from a seeded run — the same three views you just scrolled through, frozen at 0x5EED so any reviewer sees the identical state."
          >
            Screenshots,
            <br />
            as committed.
          </SectionTitle>
        </div>
        <div className="flex gap-2 pb-1">
          <Chip tone="cy">docs/img/ ×3</Chip>
          <Chip tone="sim">seed 0x5EED</Chip>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SHOTS.map((s, i) => (
          <figure
            key={s.file}
            className={`reveal reveal-d${(i % 3) + 1} group overflow-hidden rounded-lg border border-line bg-ink-900/80 transition-all duration-300 hover:border-cy/40 hover:shadow-[0_18px_50px_-24px_rgba(88,199,243,0.35)] ${
              s.wide ? "md:col-span-2" : ""
            }`}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-2 border-b border-line bg-ink-850 px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fail/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
              <span className="ml-3 flex min-w-0 items-center gap-2 rounded border border-line-soft bg-ink-950/70 px-3 py-1 font-mono text-[10.5px] text-fog-dim">
                <span className="led-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-pass text-pass" />
                <span className="truncate">{s.url}</span>
              </span>
              <span className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-wider text-fog-dim sm:inline">
                1600 × 1000
              </span>
            </div>

            {/* image */}
            <div className="relative overflow-hidden bg-ink-950">
              <img
                src={s.src}
                alt={s.title}
                loading="lazy"
                className="block w-full transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded border border-line bg-ink-950/80 px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider text-fog opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Icon name="doc" size={10} className="text-cy" /> readme figure {i + 1}
              </div>
            </div>

            {/* caption */}
            <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4">
              <code className="rounded border border-line-soft bg-ink-950/70 px-2 py-1 font-mono text-[10.5px] text-cy">
                {s.file}
              </code>
              <div className="min-w-0">
                <div className="font-display text-[13.5px] font-semibold text-paper">{s.title}</div>
                <div className="text-[11.5px] leading-snug text-fog">{s.caption}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="reveal reveal-d3 mt-6 flex items-start gap-2.5 rounded-md border border-line bg-ink-900/60 px-5 py-3.5 font-mono text-[11px] leading-relaxed text-fog">
        <Icon name="check" size={12} className="mt-0.5 shrink-0 text-pass" />
        Figures are committed under docs/img/ and referenced from README §Screenshots — the same convention a
        hardware repo would use, applied to a simulated one. CI recaptures them on every tagged release.
      </p>
    </section>
  );
}
