import { TEST_CATALOG } from "../lib/sim";
import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";

const SUITE_META: {
  id: string;
  marker: string;
  layers: string;
  proves: string;
  env: string;
  tone: "pass" | "warn" | "cy" | "sim" | "fail" | "fog";
}[] = [
  {
    id: "functional", marker: "-m functional", layers: "L2 · L3 · L4",
    proves: "The fabric behaves per standard: MAC learning floods unknown DAs once, VLANs isolate, ARP resolves, TCP establishes, UDP delivers.",
    env: "simulated", tone: "cy",
  },
  {
    id: "negative", marker: "-m negative", layers: "L2 · L3 · L4",
    proves: "Failures are loud, typed and correct: VLAN 4096 rejected, dead device times out, bad FCS dropped and counted, impossible metrics raise.",
    env: "simulated", tone: "fail",
  },
  {
    id: "regression", marker: "-m regression", layers: "L2 · L3",
    proves: "Fixed bugs stay fixed: NET-142 aging, NET-118 gratuitous ARP, NET-157 ingress-port loops, NET-101 counter wrap — each test cites its bug.",
    env: "simulated", tone: "warn",
  },
  {
    id: "performance", marker: "-m performance", layers: "L3 · L4",
    proves: "Seeded streams are measured, not asserted into existence: p95 RTT, loss budget, 1G throughput, RFC 3550 jitter vs lab.yaml thresholds.",
    env: "simulated", tone: "pass",
  },
  {
    id: "integration", marker: "-m integration", layers: "seams",
    proves: "The composition holds: managers connect/disconnect cycles, adapter hot-swap keeps the contract, results.json matches its schema.",
    env: "simulated", tone: "sim",
  },
  {
    id: "unit", marker: "-m unit", layers: "none",
    proves: "Pure math under a microscope: percentiles on known vectors, jitter → 0 on constant streams, boundary inputs raise MetricsError.",
    env: "no devices", tone: "fog",
  },
];

const REAL: string[] = [
  "Test design: markers, fixtures, isolation, negative paths",
  "Measurement math: percentiles, jitter, loss, throughput — unit-tested",
  "Configuration discipline: lab.yaml drives topology, adapters, thresholds",
  "Typed error contracts between every layer",
  "Structured JSON logging with test/device/operation context",
  "The CI pipeline itself: lint → types → tests → coverage gate → artifacts",
];

const SIMULATED: string[] = [
  "The switches: in-process models with real L2/L3 rules, not hardware",
  "Packet transport: seeded Poisson arrivals, not a wire",
  "Impairments: Bernoulli/burst loss models, not optics or queues",
  "Latency distributions: modeled shape, not a physical path",
  "Traffic generator stats: computed from the model's samples",
];

export function Suites() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="suites" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal">
        <Kicker index="04">test strategy</Kicker>
        <SectionTitle
          sub={`Six suites, one marker each, ${TEST_CATALOG.length} named cases. The ledger below is what a reviewer should interrogate — every row is executable in CI today.`}
        >
          A suite for every
          <br />
          way things break.
        </SectionTitle>
      </div>

      {/* ledger */}
      <div className="reveal reveal-d1 mt-12 overflow-hidden rounded-lg border border-line">
        {SUITE_META.map((s, i) => {
          const count = TEST_CATALOG.filter((t) => t.suite === s.id).length;
          return (
            <div
              key={s.id}
              className={`group grid gap-3 bg-ink-900/70 px-5 py-5 transition-all duration-300 hover:bg-ink-850 sm:grid-cols-[170px_150px_1fr] sm:gap-6 ${
                i > 0 ? "border-t border-line-soft" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-sm ${
                    s.tone === "cy" ? "bg-cy" : s.tone === "fail" ? "bg-fail" : s.tone === "warn" ? "bg-warn" : s.tone === "pass" ? "bg-pass" : s.tone === "sim" ? "bg-sim" : "bg-fog-dim"
                  } transition-transform duration-300 group-hover:scale-125`} />
                  <span className="font-display text-lg font-bold text-paper">{s.id}</span>
                  <span className="font-mono text-[11px] tabular-nums text-fog-dim">×{count}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Chip tone={s.tone}>{s.layers}</Chip>
                  <Chip tone="sim">{s.env}</Chip>
                </div>
              </div>
              <code className="h-fit rounded border border-line-soft bg-ink-950/60 px-2 py-1 font-mono text-[11px] text-pass/90">
                pytest {s.marker}
              </code>
              <p className="text-[13.5px] leading-relaxed text-fog">{s.proves}</p>
            </div>
          );
        })}
      </div>

      {/* real vs simulated */}
      <div className="reveal reveal-d2 mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-pass/25 bg-pass/[0.04] p-6">
          <div className="flex items-center gap-2.5">
            <Icon name="check" size={16} className="text-pass" />
            <h3 className="font-display text-lg font-bold text-paper">Genuinely real</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {REAL.map((r) => (
              <li key={r} className="flex gap-2.5 text-[13px] leading-snug text-fog">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-pass/80" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-sim/25 bg-sim/[0.04] p-6">
          <div className="flex items-center gap-2.5">
            <Icon name="flask" size={16} className="text-sim" />
            <h3 className="font-display text-lg font-bold text-paper">Deliberately simulated</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {SIMULATED.map((r) => (
              <li key={r} className="flex gap-2.5 text-[13px] leading-snug text-fog">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sim/80" />
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-sim/15 pt-3.5 font-mono text-[11px] leading-relaxed text-fog-dim">
            Every report, artifact and log line carries an <span className="text-sim">environment: simulated</span> stamp.
            The day hardware arrives, only the adapters change — the assertions don't.
          </p>
        </div>
      </div>
    </section>
  );
}
