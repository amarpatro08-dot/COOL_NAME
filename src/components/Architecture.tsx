import { useState } from "react";
import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";

interface Module {
  id: string;
  title: string;
  file: string;
  tag: string;
  responsibilities: string[];
  iface: string[];
  failureNote: string;
  dashed?: boolean;
}

const MODULES: Record<string, Module> = {
  cli: {
    id: "cli", title: "CLI / API", file: "src/nettest/cli.py", tag: "click",
    responsibilities: [
      "Human entry point: list, run, report, devices",
      "Translates suite names into pytest marker expressions",
      "Owns exit codes so CI can gate on them",
    ],
    iface: ["network-test list", "network-test run <suite> --seed 0x.. ", "network-test report", "network-test devices"],
    failureNote: "Unknown suite or config path fails fast with InvalidConfigurationError before any device is touched.",
  },
  orch: {
    id: "orch", title: "Test Orchestrator", file: "src/nettest/orchestrator.py", tag: "composition root",
    responsibilities: [
      "Loads lab.yaml and validates it",
      "Builds Device/Traffic managers from config",
      "Invokes pytest.main() with marker expressions",
      "Hands results to reporting",
    ],
    iface: ["load()", "build_devices(cfg)", "build_traffic(cfg)", "run_suite(suite) -> int"],
    failureNote: "The only module that knows everything; test files never import it — it collects them.",
  },
  tmgr: {
    id: "tmgr", title: "Test Manager", file: "pytest + tests/", tag: "pytest",
    responsibilities: [
      "Discovery and selection via registered markers",
      "Fixture-scoped lab lifecycle per session",
      "Per-test device reset (isolation, anti-flake)",
    ],
    iface: ["-m functional", "-m negative", "-m regression", "-m performance", "-m integration", "-m unit"],
    failureNote: "A failing fixture surfaces as ERROR at setup with the device/operation context already in the log record.",
  },
  dmgr: {
    id: "dmgr", title: "Device Manager", file: "orchestrator.DeviceManager", tag: "registry",
    responsibilities: [
      "Instantiates adapters by config type (match statement)",
      "connect_all / disconnect_all with typed errors",
      "Hot-swap slot: MockDevice ↔ SimulatedSwitch",
    ],
    iface: ["devices: dict[str, Device]", "connect_all(timeout_s)", "disconnect_all()"],
    failureNote: "Serial connect today; the async fan-out for hundreds of devices lives behind the same two methods.",
  },
  trmgr: {
    id: "trmgr", title: "Traffic Manager", file: "orchestrator.build_traffic", tag: "registry",
    responsibilities: [
      "Selects generator implementation from lab.yaml",
      "Seeds the simulator for reproducible streams",
      "Holds the slot where IxiaAdapter would be built",
    ],
    iface: ["build_traffic(cfg) -> TrafficGenerator"],
    failureNote: "type: ixia raises NotImplementedError with an honest message — the repo never pretends the chassis exists.",
  },
  suites: {
    id: "suites", title: "pytest Suites", file: "tests/{functional,negative,...}", tag: "6 suites",
    responsibilities: [
      "Assertions only — no orchestration inside tests",
      "Negative tests assert raised typed errors",
      "Regression tests cite the bug ID they bury",
    ],
    iface: ["@pytest.mark.functional", "@pytest.mark.simulated", "pytest.raises(InvalidConfigurationError)"],
    failureNote: "Tests receive adapters from fixtures, so swapping simulated → physical never edits a test file.",
  },
  adapters: {
    id: "adapters", title: "Device Adapters", file: "src/nettest/devices/", tag: "ABC seam",
    responsibilities: [
      "Device ABC: connect / disconnect / configure / execute_command / get_status / reset",
      "SimulatedSwitch keeps real L2/L3 semantics (MAC aging, 802.1Q, ARP rules)",
      "MockDevice for endpoints and unit tests",
    ],
    iface: ["class Device(ABC)", "class SimulatedSwitch(Device)", "class MockDevice(Device)"],
    failureNote: "Session methods are idempotent; every failure is a typed DeviceError, never a bare Exception.",
  },
  generators: {
    id: "generators", title: "Traffic Adapters", file: "src/nettest/traffic/", tag: "ABC seam",
    responsibilities: [
      "TrafficGenerator ABC: configure_stream / start / stop / get_statistics",
      "SoftwareTrafficGenerator: seeded Poisson arrivals, Bernoulli/burst loss",
      "IxiaAdapter slot: same surface over ixnetwork REST",
    ],
    iface: ["class TrafficGenerator(ABC)", "class SoftwareTrafficGenerator(TrafficGenerator)", "# class IxiaAdapter(TrafficGenerator): planned"],
    failureNote: "Stats always return the same TrafficStats dataclass — metrics.py cannot tell simulated from hardware.",
  },
  lab: {
    id: "lab", title: "Lab Fabric", file: "config/lab.yaml", tag: "simulated today",
    responsibilities: [
      "2 simulated switches + 3 mock endpoints in-process",
      "Declared in YAML, not in source",
      "Future: physical rack behind real adapters",
    ],
    iface: ["environment: simulated", "devices: {sw-core-01, sw-acc-02, host-a..c}", "traffic.generator.type: software"],
    failureNote: "The whole topology is data — a second lab file is a new scenario, not new code.",
  },
  results: {
    id: "results", title: "Metrics / Results", file: "src/nettest/metrics.py · reporting.py", tag: "artifact of record",
    responsibilities: [
      "Pure metric math: percentiles, RFC 3550 jitter, loss %, Mbps",
      "results.json is the single source of truth",
      "Console summary and report.html render from it",
    ],
    iface: ["percentile()", "rfc3550_jitter()", "packet_loss_pct()", "build_results_document()"],
    failureNote: "metrics.py raises MetricsError on impossible input instead of returning a comforting wrong number.",
  },
};

const ROWS: string[][] = [["cli"], ["orch"], ["tmgr", "dmgr", "trmgr"], ["suites", "adapters", "generators"], ["lab"], ["results"]];

export function Architecture() {
  const ref = useReveal<HTMLDivElement>();
  const [active, setActive] = useState("orch");
  const mod = MODULES[active];

  return (
    <section id="architecture" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal">
        <Kicker index="02">architecture</Kicker>
        <SectionTitle
          sub="Three narrow seams — Device, TrafficGenerator, Orchestrator — and composition everywhere else. Click any block: what it owns, what it exposes, and how it fails."
        >
          Small seams,
          <br />
          honest boundaries.
        </SectionTitle>
      </div>

      <div className="reveal reveal-d1 mt-12 grid gap-8 lg:grid-cols-12">
        {/* diagram */}
        <div className="lg:col-span-7">
          <div className="rounded-lg border border-line bg-ink-900/70 p-5 sm:p-7">
            {ROWS.map((row, ri) => (
              <div key={ri}>
                <div className={`grid gap-3 ${row.length === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
                  {row.map((id) => {
                    const m = MODULES[id];
                    const on = active === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActive(id)}
                        className={`group relative rounded-md border px-3.5 py-3 text-left transition-all duration-300 ${
                          on
                            ? "border-cy/70 bg-cy/[0.09] shadow-[0_0_24px_rgba(88,199,243,0.15)]"
                            : "border-line bg-ink-850 hover:border-cy/40 hover:bg-ink-800"
                        }`}
                      >
                        <div className={`font-display text-[13px] font-semibold sm:text-sm ${on ? "text-cy" : "text-paper"}`}>
                          {m.title}
                        </div>
                        <div className="mt-1 hidden truncate font-mono text-[10px] text-fog-dim sm:block">{m.file}</div>
                        <span className={`absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full transition-colors ${on ? "bg-cy" : "bg-ink-700 group-hover:bg-fog-dim"}`} />
                      </button>
                    );
                  })}
                </div>
                {ri < ROWS.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-px bg-gradient-to-b from-line to-cy/50" />
                      <Icon name="chev" size={10} className="rotate-90 text-cy/60" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
              <Chip tone="sim">dashed = planned</Chip>
              <span className="font-mono text-[11px] text-fog-dim">
                IxiaAdapter occupies the TrafficGenerator seam — designed, documented, not pretended.
              </span>
            </div>
          </div>
        </div>

        {/* detail panel */}
        <div className="lg:col-span-5">
          <div key={mod.id} className="sticky top-24 overflow-hidden rounded-lg border border-line bg-ink-900/80">
            <div className="border-b border-line bg-ink-850 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold text-paper">{mod.title}</h3>
                <Chip tone="cy">{mod.tag}</Chip>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-cy">{mod.file}</div>
            </div>
            <div className="space-y-5 px-5 py-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">owns</div>
                <ul className="mt-2 space-y-1.5">
                  {mod.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-snug text-fog">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cy/70" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-dim">interface</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mod.iface.map((f) => (
                    <code key={f} className="rounded border border-line-soft bg-ink-950/70 px-2 py-1 font-mono text-[10.5px] text-pass/90">
                      {f}
                    </code>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-warn/25 bg-warn/[0.05] px-3.5 py-3">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-warn">
                  <Icon name="warning" size={12} /> when it fails
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-fog">{mod.failureNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
