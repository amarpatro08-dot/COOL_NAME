export interface CouncilOpinion {
  member: string;
  role: string;
  recommendation: string;
  concern: string;
  severity: "critical" | "high" | "medium" | "low";
  improvement: string;
}

export const COUNCIL_PHASE3: CouncilOpinion[] = [
  {
    member: "Architect",
    role: "scalability · modularity · complexity",
    recommendation: "Keep three narrow seams only: Device, TrafficGenerator, Orchestrator. Everything else is composition.",
    concern: "A 'manager per concern' diagram tempts people into three parallel frameworks. DeviceManager and TrafficManager are registries, not layers.",
    severity: "high",
    improvement: "Managers stay under 80 lines. If a manager grows logic, that logic belongs in an adapter or in metrics.py.",
  },
  {
    member: "Network Engineer",
    role: "protocol correctness",
    recommendation: "Simulate semantics that are actually assertable in software: MAC learning/aging, 802.1Q VLAN isolation, ARP cache rules, FCS drop, counter wrap.",
    concern: "Do not fake L4. A browser/CI box cannot honestly claim to measure real TCP retransmission behavior — model streams statistically and say so.",
    severity: "high",
    improvement: "Every simulated dataplane behavior maps to a named standard behavior (RFC 5227 gratuitous ARP, RFC 3550 jitter, 802.1Q 4095 reservation). Cite it in the docstring.",
  },
  {
    member: "QA / Test Engineer",
    role: "coverage · isolation · flakes",
    recommendation: "Six suites with registered markers; device reset fixture between every test; deterministic seed on all simulated traffic.",
    concern: "Performance tests are the classic flake source. Thresholds plus a stochastic simulator will fail randomly one day.",
    severity: "critical",
    improvement: "Seeded RNG makes runs reproducible; thresholds come from config so they can be widened per environment without code changes; negative tests assert raised types, not messages.",
  },
  {
    member: "DevOps Engineer",
    role: "CI · reproducibility · workflow",
    recommendation: "One workflow: ruff → mypy → unit(+coverage) → suites → coverage gate → artifacts. Two-version matrix (3.11 floor, 3.12 current) — no more.",
    concern: "Uploading reports that silently vanish on failure is useless; artifact steps must run with if: always().",
    severity: "medium",
    improvement: "junitxml per stage plus results/ directory as a single artifact; --junitxml names tell you which stage died from the artifact alone.",
  },
  {
    member: "Security Engineer",
    role: "secrets · injection · supply chain",
    recommendation: "No credentials exist anywhere: the simulated lab needs none. When physical adapters arrive, secrets come from environment variables only.",
    concern: "execute_command() taking free strings is the classic path to shell injection if a real adapter ever wraps it in subprocess.",
    severity: "high",
    improvement: "Adapters are required to use structured transports (NETCONF/SSH channels), never shell=True; document this as an interface contract. Log redaction masks secret-looking keys today, before they exist.",
  },
  {
    member: "Hiring Manager",
    role: "would I hire from this repo?",
    recommendation: "Lead with the negative and regression suites in the README walkthrough — juniors rarely write them, and they show engineering judgment.",
    concern: "A metrics dashboard with invented numbers is a red flag, not a feature. Reviewers spot 'p95 = 0.42ms' hardcoded faster than they spot anything else.",
    severity: "critical",
    improvement: "Every displayed number must be computed from samples at runtime, and every report carries an environment: simulated stamp. The README says what is NOT real, in its own section.",
  },
  {
    member: "Skeptical Reviewer",
    role: "finding where you get exposed",
    recommendation: "Expect the question 'so what is actually real here?' Answer: the architecture, the measurement math, the config discipline, the CI pipeline, and the test design. The fabric is software.",
    concern: "Claiming 'Ixia-ready' without ever touching Ixia can backfire if an interviewer probes the ixnetwork API.",
    severity: "medium",
    improvement: "Phrase it as 'adapter slot exists; IxiaAdapter would implement TrafficGenerator over ixnetwork REST'. Defensible, honest, and shows you know where the seam is.",
  },
];

export const COUNCIL_DECISIONS: { decision: string; rationale: string }[] = [
  {
    decision: "Two adapter ABCs (Device, TrafficGenerator) + one orchestrator. No plugin system.",
    rationale: "A registry-based plugin layer is premature at 5 devices; a match statement in the orchestrator is readable and interview-defensible.",
  },
  {
    decision: "pytest is the test runner; the orchestrator invokes pytest.main() with marker expressions.",
    rationale: "Reuses collection, reporting, and -m selection instead of reimplementing them; suites map 1:1 to markers.",
  },
  {
    decision: "Deterministic seeded simulation; thresholds live in lab.yaml, never in test code.",
    rationale: "Reproducible CI plus per-environment tunable bars are the only honest way to have performance tests without hardware.",
  },
  {
    decision: "results.json is the artifact of record; console and HTML render from it.",
    rationale: "One source of truth means the report can never disagree with the machine-readable results.",
  },
  {
    decision: "Every simulated surface carries the marker @pytest.mark.simulated and an 'environment: simulated' stamp in outputs.",
    rationale: "Honesty about what is real is the project's credibility mechanism.",
  },
];

export interface Weakness {
  rank: number;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
  mitigation: string;
}

export const FINAL_REVIEW_WEAKNESSES: Weakness[] = [
  {
    rank: 1,
    title: "No real hardware has ever run through these adapters",
    severity: "critical",
    detail: "The Device contract is untested against real serial/SSH timing, paging prompts, or vendor output drift. A SimulatedSwitch that returns exactly what tests expect is the cozy case.",
    mitigation: "Recorded-output replay adapter (feed real 'show' captures through a fixture) is the cheapest next step before touching a switch.",
  },
  {
    rank: 2,
    title: "Simulated latency model is not a network",
    severity: "high",
    detail: "Exponential noise + spikes mimics a distribution shape; it does not model queueing, congestion collapse, or retransmission interaction. Perf results say 'simulated' for a reason.",
    mitigation: "Documented in Limitations; a tc/netem-based loopback stage on Linux would replace the pure-RNG model with kernel-level impairment.",
  },
  {
    rank: 3,
    title: "Single-process scale ceiling",
    severity: "high",
    detail: "pytest-xdist isn't wired; 5 devices is fine, 500 is not. DeviceManager connects serially.",
    mitigation: "Roadmap item: xdist group-per-device plus async connect_all; the interface already supports concurrent use.",
  },
  {
    rank: 4,
    title: "No long-running soak or stability suite",
    severity: "medium",
    detail: "Everything runs in seconds. Real labs need hour-long stability runs that catch slow leaks (MAC table growth, counter drift).",
    mitigation: "A 'soak' marker with scaled durations for nightly CI, gated out of the PR path.",
  },
  {
    rank: 5,
    title: "Ixia slot is untested code",
    severity: "medium",
    detail: "The adapter boundary is designed but never compiled against ixnetwork. Mapping assumptions (trafficItem ↔ StreamConfig) could be wrong in detail.",
    mitigation: "Explicitly framed as a design seam with a documented mapping table, not as working integration.",
  },
  {
    rank: 6,
    title: "No chaos/fault injection in the Python repo itself",
    severity: "medium",
    detail: "The demo site can inject a trunk fault; the pytest suites currently only test static failure modes.",
    mitigation: "Add a fault-injection fixture (link flaps mid-stream) to the negative suite.",
  },
  {
    rank: 7,
    title: "HTML report is functional, not polished",
    severity: "low",
    detail: "Jinja2 template renders all sections but has no trend history across runs.",
    mitigation: "Persist per-run summaries to a history.json the template can chart.",
  },
  {
    rank: 8,
    title: "Matrix covers two Python versions only",
    severity: "low",
    detail: "Justified for now (floor + current), but OS diversity (macOS dev boxes) is untested.",
    mitigation: "Add macos-latest to the matrix only if a contributor actually develops there — no speculative CI.",
  },
  {
    rank: 9,
    title: "Config schema is validated by hand",
    severity: "medium",
    detail: "load_config checks types imperatively; a JSON Schema for lab.yaml would catch drift mechanically.",
    mitigation: "jsonschema is already a dependency — schema file is a small, high-value next commit.",
  },
  {
    rank: 10,
    title: "One maintainer, one lab topology",
    severity: "low",
    detail: "All tests assume demo-lab-01's shape. A second topology file would prove the config abstraction actually abstracts.",
    mitigation: "examples/lab-spine-leaf.yaml as a second config exercised by integration tests.",
  },
];
