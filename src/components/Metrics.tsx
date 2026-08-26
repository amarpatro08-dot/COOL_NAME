import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32 } from "../lib/sim";
import { Chip, Kicker, SectionTitle, usePrefersReducedMotion, useReveal } from "../lib/ui";

const FORMULAS: { name: string; formula: string; note: string }[] = [
  {
    name: "packet loss",
    formula: "loss% = (tx − rx) / tx × 100",
    note: "Counters come from TrafficStats; metrics.py raises MetricsError on sent ≤ 0 or rx > tx instead of returning garbage.",
  },
  {
    name: "latency percentiles",
    formula: "p95 = sorted_samples[⌈0.95·n⌉−1]",
    note: "Nearest-rank over RTT samples drawn by the stream; min/avg/p50/p95/p99/max all reported, p95 gates the threshold test.",
  },
  {
    name: "jitter (RFC 3550 §6.4.1)",
    formula: "J(i) = J(i−1) + (|D(i−1,i)| − J(i−1)) / 16",
    note: "The RTP interarrival estimator, applied to sample deltas — converges to 0 on a constant stream, which the unit test proves.",
  },
  {
    name: "throughput",
    formula: "Mbps = bytes_tx × 8 / duration / 10⁶",
    note: "Wire bytes include preamble/IFG/CRC overhead (+38 B per frame), so the number is honest about what a 1G link actually carries.",
  },
];

/** Recompute a fresh labeled sample set exactly the way traffic/simulator.py does. */
function computeDemoDistribution(seed: number) {
  const rng = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < 1200; i++) {
    let v = 0.42 + -Math.log(1 - rng() * 0.985) * 0.42 * 0.55 + rng() * 0.06;
    if (rng() < 0.028) v += 1.5 + rng() * 6.5;
    samples.push(v);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  const bins = 40;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const w = (max - min) / bins;
  const hist = new Array(bins).fill(0);
  for (const v of samples) hist[Math.min(bins - 1, Math.floor((v - min) / w))]++;
  return { samples, hist, maxBin: Math.max(...hist), p50: pct(50), p95: pct(95), p99: pct(99), min, max };
}

export function Metrics() {
  const ref = useReveal<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [seed, setSeed] = useState(0x5eed);
  const [visible, setVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => computeDemoDistribution(seed), [seed]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const p95X = ((data.p95 - data.min) / (data.max - data.min)) * 100;
  const p99X = ((data.p99 - data.min) / (data.max - data.min)) * 100;

  return (
    <section id="metrics" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="05">measurement</Kicker>
          <SectionTitle
            sub="The framework's credibility lives in four functions. They are pure, unit-tested on known vectors, and deliberately ignorant of where their samples came from."
          >
            Numbers computed,
            <br />
            never narrated.
          </SectionTitle>
        </div>
        <button
          onClick={() => setSeed((s) => (s * 16807 + 1) >>> 0 || 0x5eed)}
          className="mb-1 flex items-center gap-2 rounded border border-line bg-ink-850 px-4 py-2 font-mono text-[11.5px] text-cy transition-all duration-200 hover:border-cy/50 hover:shadow-[0_0_16px_rgba(88,199,243,0.2)]"
        >
          <IconRefresh /> reseed · 0x{seed.toString(16).toUpperCase()}
        </button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-12">
        {/* formulas */}
        <div className="space-y-3.5 lg:col-span-5">
          {FORMULAS.map((f, i) => (
            <div key={f.name} className={`reveal reveal-d${(i % 3) + 1} group rounded-md border border-line bg-ink-900/70 px-5 py-4 transition-all duration-300 hover:border-cy/40 hover:bg-ink-850`}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">{f.name}</span>
                <code className="font-mono text-[12px] text-cy">{f.formula}</code>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-fog">{f.note}</p>
            </div>
          ))}
          <div className="reveal reveal-d3 rounded-md border border-warn/25 bg-warn/[0.05] px-5 py-3.5">
            <p className="font-mono text-[11px] leading-relaxed text-fog">
              <span className="text-warn">ANTI-PATTERN GUARD</span> — a dashboard with hand-typed p95 values is the fastest
              way to fail an engineering interview. Here, reseed and watch every bar and percentile recompute.
            </p>
          </div>
        </div>

        {/* live histogram */}
        <div className="lg:col-span-7" ref={chartRef}>
          <div className="reveal reveal-d1 rounded-lg border border-line bg-ink-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-paper">RTT distribution — 1,200 fresh samples</h3>
                <p className="mt-0.5 font-mono text-[11px] text-fog-dim">same model as traffic/simulator.py · exponential base + 2.8% queueing spikes</p>
              </div>
              <Chip tone="sim">recomputed on reseed</Chip>
            </div>

            <div className="mt-6 flex h-44 items-end gap-[3px]">
              {data.hist.map((h, i) => {
                const x = (i / (data.hist.length - 1)) * 100;
                const pastP95 = x >= p95X;
                return (
                  <div key={`${seed}-${i}`} className="group relative flex-1">
                    <div
                      className={`w-full rounded-t-[2px] transition-all duration-700 ease-out ${
                        pastP95 ? "bg-warn/80 group-hover:bg-warn" : "bg-cy/55 group-hover:bg-cy"
                      }`}
                      style={{
                        height: visible || reduced ? `${Math.max(2, (h / data.maxBin) * 160)}px` : "2px",
                        transitionDelay: reduced ? "0ms" : `${i * 14}ms`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* axis markers */}
            <div className="relative mt-2 h-9 border-t border-line-soft">
              {[
                { x: 0, label: `min ${data.min.toFixed(2)}`, tone: "text-fog-dim" },
                { x: p95X, label: `p95 ${data.p95.toFixed(2)}ms`, tone: "text-warn" },
                { x: p99X, label: `p99 ${data.p99.toFixed(2)}ms`, tone: "text-fail" },
                { x: 100, label: `max ${data.max.toFixed(2)}`, tone: "text-fog-dim" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${Math.min(96, Math.max(4, m.x))}%` }}
                >
                  <div className={`mx-auto h-2 w-px ${m.tone === "text-fog-dim" ? "bg-line" : "bg-warn/70"}`} />
                  <span className={`block whitespace-nowrap font-mono text-[10px] ${m.tone}`}>{m.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line-soft pt-4 font-mono text-[11px] sm:grid-cols-4">
              <div><span className="text-fog-dim">p50 </span><span className="text-paper">{data.p50.toFixed(3)} ms</span></div>
              <div><span className="text-fog-dim">p95 </span><span className="text-warn">{data.p95.toFixed(3)} ms</span></div>
              <div><span className="text-fog-dim">p99 </span><span className="text-fail">{data.p99.toFixed(3)} ms</span></div>
              <div><span className="text-fog-dim">tail </span><span className="text-paper">{(data.max - data.p95).toFixed(2)} ms</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconRefresh() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 11-2.3-5.6M20 3.5V8h-4.5" />
    </svg>
  );
}
