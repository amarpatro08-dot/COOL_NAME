import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";

const STAGES: { name: string; cmd: string; time: string; note: string; status: "pass" | "gate" }[] = [
  { name: "checkout", cmd: "actions/checkout@v4", time: "2s", note: "Shallow clone; the repo is the whole world.", status: "pass" },
  { name: "setup-python", cmd: "matrix: 3.11 · 3.12", time: "6s", note: "Two versions on purpose — declared floor + current stable. No speculative matrix.", status: "pass" },
  { name: "install", cmd: "pip install -e \".[dev]\"", time: "14s", note: "Editable install exercises pyproject exactly like a user would.", status: "pass" },
  { name: "lint", cmd: "ruff check src tests", time: "3s", note: "E/F/I/B/UP/SIM rules; formatting debates end here.", status: "pass" },
  { name: "typecheck", cmd: "mypy src --strict", time: "11s", note: "Strict mode is non-negotiable: adapters are only as good as their types.", status: "pass" },
  { name: "unit + coverage", cmd: "pytest -m unit --cov", time: "9s", note: "Pure math first — if percentile() is wrong, nothing downstream matters.", status: "pass" },
  { name: "functional · negative · regression", cmd: "pytest -m \"functional or negative or regression\"", time: "21s", note: "The simulated lab boots from lab.yaml; junitxml per stage.", status: "pass" },
  { name: "performance · integration", cmd: "pytest -m \"performance or integration\"", time: "18s", note: "Seeded streams; thresholds from config. Reproducible failure = debuggable failure.", status: "pass" },
  { name: "coverage gate", cmd: "coverage report --fail-under=85", time: "1s", note: "A gate with a number, not a vibe. Below 85%, the build is red.", status: "gate" },
  { name: "artifacts", cmd: "upload-artifact · if: always()", time: "4s", note: "results/, coverage.xml, report.html — uploaded even on failure, because that's when you need them.", status: "pass" },
];

export function Pipeline() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="ci" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="07">ci / cd</Kicker>
          <SectionTitle
            sub="One workflow file, zero secrets, and artifacts that survive failure. The pipeline below is .github/workflows/ci.yml — also open in the code explorer."
          >
            The build either
            <br />
            proves it, or blocks.
          </SectionTitle>
        </div>
        <div className="flex flex-col items-end gap-2 pb-1">
          <div className="flex gap-2">
            <Chip tone="cy">ubuntu-latest</Chip>
            <Chip tone="pass">py 3.11</Chip>
            <Chip tone="pass">py 3.12</Chip>
          </div>
          <span className="font-mono text-[11px] text-fog-dim">≈ 89s wall time per matrix leg · fully simulated</span>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        {/* stages */}
        <div className="lg:col-span-7">
          <div className="relative">
            <div className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-cy/50 via-line to-pass/40" />
            <div className="space-y-2.5">
              {STAGES.map((s, i) => (
                <div
                  key={s.name}
                  className="reveal group relative flex items-start gap-4 rounded-md border border-line bg-ink-900/70 px-4 py-3.5 pl-11 transition-all duration-300 hover:border-cy/40 hover:bg-ink-850"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <span className={`absolute left-[9px] top-[18px] h-[13px] w-[13px] rounded-full border-2 ${
                    s.status === "gate" ? "border-warn bg-warn/20" : "border-pass bg-pass/20"
                  } transition-transform duration-300 group-hover:scale-125`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[14px] font-semibold text-paper">{s.name}</span>
                      <code className="truncate font-mono text-[11px] text-cy/90">{s.cmd}</code>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-fog">{s.note}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-fog-dim">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* side notes */}
        <div className="space-y-4 lg:col-span-5">
          <div className="reveal reveal-d1 rounded-lg border border-line bg-ink-900/70 p-6">
            <div className="flex items-center gap-2.5">
              <Icon name="git" size={16} className="text-cy" />
              <h3 className="font-display text-lg font-bold text-paper">Artifacts of record</h3>
            </div>
            <div className="mt-4 space-y-2 font-mono text-[11.5px]">
              {[
                ["results/functional.xml", "junit — stage verdicts"],
                ["results/perf.xml", "junit — perf + integration"],
                ["results/results.json", "schema nettest.results/v1"],
                ["results/report.html", "human-readable report"],
                ["coverage.xml", "branch coverage, gate ≥ 85%"],
              ].map(([f, d]) => (
                <div key={f} className="flex items-center justify-between gap-3 rounded border border-line-soft bg-ink-950/60 px-3 py-2 transition-colors hover:border-cy/30">
                  <span className="text-pass/90">{f}</span>
                  <span className="text-right text-[10.5px] text-fog-dim">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal reveal-d2 rounded-lg border border-line bg-ink-900/70 p-6">
            <div className="flex items-center gap-2.5">
              <Icon name="shield" size={16} className="text-pass" />
              <h3 className="font-display text-lg font-bold text-paper">Why this pipeline is defensible</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                "No secrets exist to leak: the simulated lab needs none; physical-phase credentials are specced as env vars only.",
                "Every stage that can fail writes its own junit file — the artifact name diagnoses the failure before logs open.",
                "if: always() on upload/report: a red build still leaves forensic evidence behind.",
                "Two-version matrix, not six: the floor (3.11) and the current (3.12). Anything more is CI theater.",
                "The coverage gate is a number in the file, so 'we have tests' is auditable in one grep.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[13px] leading-snug text-fog">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-pass/80" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal reveal-d3 flex items-start gap-3 rounded-lg border border-warn/25 bg-warn/[0.05] p-5">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="font-mono text-[11px] leading-relaxed text-fog">
              <span className="text-warn">HONEST SCOPE</span> — CI exercises the simulated environment. The workflow is
              hardware-ready by construction (same markers, same thresholds), but no pipeline step pretends to touch a
              physical device.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
