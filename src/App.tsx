import { Architecture } from "./components/Architecture";
import { CodeExplorer } from "./components/CodeExplorer";
import { Council } from "./components/Council";
import { Interview } from "./components/Interview";
import { Metrics } from "./components/Metrics";
import { Pipeline } from "./components/Pipeline";
import { Runner } from "./components/Runner";
import { Suites } from "./components/Suites";
import { Chip, Icon, Kicker, SectionTitle, useReveal } from "./lib/ui";

const NAV = [
  ["console", "01 console"],
  ["architecture", "02 architecture"],
  ["code", "03 code"],
  ["suites", "04 suites"],
  ["metrics", "05 metrics"],
  ["council", "06 council"],
  ["ci", "07 ci/cd"],
  ["interview", "08 defense"],
] as const;

function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3L27.3 9.5v13L16 29 4.7 22.5v-13L16 3z" stroke="var(--color-cy)" strokeWidth="1.6" />
      <circle cx="16" cy="11" r="2.4" fill="var(--color-cy)" />
      <circle cx="10.5" cy="20" r="2.4" fill="var(--color-pass)" />
      <circle cx="21.5" cy="20" r="2.4" fill="var(--color-sim)" />
      <path d="M16 13.4l-4.4 4.6M16 13.4l4.4 4.6M12.9 20h6.2" stroke="var(--color-fog)" strokeWidth="1.2" />
    </svg>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-3 sm:px-8">
        <a href="#console" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[15px] font-bold tracking-[0.14em] text-paper">
            NET<span className="text-cy">TEST</span>
          </span>
          <span className="hidden rounded border border-line bg-ink-850 px-1.5 py-0.5 font-mono text-[9.5px] text-fog-dim sm:inline">
            v0.4.2
          </span>
        </a>
        <nav className="terminal-scroll ml-auto hidden items-center gap-1 overflow-x-auto lg:flex">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap rounded px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog transition-colors duration-200 hover:bg-ink-800 hover:text-cy"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-fog-dim sm:flex">
            <span className="led-pulse h-1.5 w-1.5 rounded-full bg-pass text-pass" />
            simulated lab online
          </span>
        </div>
      </div>
      {/* mobile nav */}
      <nav className="terminal-scroll flex gap-1 overflow-x-auto border-t border-line-soft px-4 py-2 lg:hidden">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="whitespace-nowrap rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-fog hover:text-cy">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

const LIMITATIONS = [
  "No physical device has ever been driven by these adapters — the Device contract is proven against a model, not a serial console.",
  "Simulated latency and loss are distribution-shaped models, not queueing systems; congestion collapse is out of scope.",
  "The performance suite proves the measurement machinery, not a fabric's silicon.",
  "Ixia support is an interface slot with a documented mapping — not working integration, and the repo says so.",
  "Single lab topology in CI; a second topology would be the real test of the config abstraction.",
];

const ROADMAP: { phase: string; item: string }[] = [
  { phase: "next", item: "Recorded-output replay adapter: real 'show' captures through fixtures, zero hardware required" },
  { phase: "next", item: "JSON Schema for lab.yaml (jsonschema is already a dependency)" },
  { phase: "next", item: "Fault-injection fixture: link flap mid-stream in the negative suite" },
  { phase: "later", item: "One real switch behind an SSH-channel adapter, --environment physical" },
  { phase: "later", item: "pytest-xdist fan-out + async connect_all for device counts beyond 50" },
  { phase: "later", item: "tc/netem-based loopback impairment to replace the pure-RNG latency model" },
  { phase: "someday", item: "IxiaAdapter over ixnetwork REST, behind the existing TrafficGenerator seam" },
];

function Closing() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="closing" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal">
        <Kicker index="09">the honest part</Kicker>
        <SectionTitle sub="Every serious project ships with a list of things it is not. This one is written down, ranked, and owned — including by the council's hostile review above.">
          Limitations in writing,
          <br />
          roadmap in order.
        </SectionTitle>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="reveal reveal-d1 rounded-lg border border-line bg-ink-900/70 p-6">
          <div className="flex items-center gap-2.5">
            <Icon name="warning" size={16} className="text-warn" />
            <h3 className="font-display text-lg font-bold text-paper">What this is not</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {LIMITATIONS.map((l) => (
              <li key={l} className="flex gap-2.5 text-[13px] leading-snug text-fog">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-warn/80" />
                {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal reveal-d2 rounded-lg border border-line bg-ink-900/70 p-6">
          <div className="flex items-center gap-2.5">
            <Icon name="arrow" size={16} className="text-cy" />
            <h3 className="font-display text-lg font-bold text-paper">Where it goes next</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {ROADMAP.map((r) => (
              <li key={r.item} className="flex gap-2.5 text-[13px] leading-snug text-fog">
                <Chip tone={r.phase === "next" ? "pass" : r.phase === "later" ? "cy" : "fog"} className="mt-0.5 shrink-0">
                  {r.phase}
                </Chip>
                {r.item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950/90">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <span className="font-display text-sm font-bold tracking-[0.14em] text-paper">
                NET<span className="text-cy">TEST</span>
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-fog">
              A deliberately small, deliberately credible network test automation platform: Python · pytest · typed
              adapters · seeded simulation · honest reports. Built as an early-career engineering portfolio piece.
            </p>
            <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-fog-dim">
              MIT license · no vendor hardware claimed · no benchmark fabricated · every displayed metric is computed
              at runtime from labeled simulated samples.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">repository</div>
            <div className="mt-3 flex max-w-sm flex-wrap gap-1.5">
              {["src/nettest/", "tests/ ×6 suites", "config/lab.yaml", ".github/workflows/ci.yml", "docs/", "examples/", "pyproject.toml", "LICENSE", ".gitignore", "README.md"].map((f) => (
                <code key={f} className="rounded border border-line-soft bg-ink-900 px-2 py-1 font-mono text-[10.5px] text-fog transition-colors hover:border-cy/40 hover:text-cy">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">stack, with reasons</div>
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-fog">
              <div><span className="text-cy">python 3.11+</span> — typed, packaged, strict mypy</div>
              <div><span className="text-cy">pytest</span> — markers, fixtures, junit, cov</div>
              <div><span className="text-cy">click</span> — CLI that owns exit codes</div>
              <div><span className="text-cy">pyyaml</span> — lab is data, not code</div>
              <div><span className="text-cy">jinja2</span> — report.html from results.json</div>
              <div><span className="text-cy">actions</span> — lint → tests → gate → artifacts</div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-6">
          <span className="font-mono text-[10.5px] text-fog-dim">
            nettest v0.4.2 · seed 0x5EED · environment: simulated · rendered without fabricated numbers
          </span>
          <a href="#console" className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-fog transition-colors hover:text-cy">
            back to the console <Icon name="arrow" size={11} className="-rotate-90" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-blueprint opacity-70" />
        <div className="absolute inset-0 bg-glowfield" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950 to-transparent" />
      </div>

      <div className="relative z-10">
        <Header />
        <main>
          <Runner />
          <Divider />
          <Architecture />
          <Divider />
          <CodeExplorer />
          <Divider />
          <Suites />
          <Divider />
          <Metrics />
          <Divider />
          <Council />
          <Divider />
          <Pipeline />
          <Divider />
          <Interview />
          <Divider />
          <Closing />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 sm:px-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-line to-transparent" />
      <span className="h-1.5 w-1.5 rotate-45 border border-cy/50" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-line to-transparent" />
    </div>
  );
}
