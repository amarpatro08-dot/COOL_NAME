export interface QA {
  q: string;
  tag: string;
  a: string[];
}

export const INTERVIEW_QA: QA[] = [
  {
    q: "Why did you design it this way?",
    tag: "architecture",
    a: [
      "The design starts from one constraint: I don't own lab hardware, but I want the project to be one config change away from it. So every place where hardware would eventually appear is an abstract interface — Device for management-plane access, TrafficGenerator for streams — and everything else is composition of those two seams.",
      "The orchestrator is the only module allowed to know about everything; tests never import concrete adapters, they receive them from fixtures. That keeps the dependency graph a tree instead of a hairball, and it means 'integrate a real switch' is a task with a known surface area: implement six methods.",
    ],
  },
  {
    q: "What alternatives did you consider?",
    tag: "architecture",
    a: [
      "Robot Framework: excellent for keyword-driven network testing, but I wanted to demonstrate Python engineering — OOP, typing, packaging — and pytest gives me markers, fixtures and parametrize natively.",
      "A homegrown runner: rejected because it would mean reimplementing collection, reporting and parallelism that pytest already does better. The orchestrator invokes pytest.main() instead of competing with it.",
      "NAPALM/Netmiko for device access: great libraries and the natural choice for the physical phase, but importing them now for a simulated lab would be dead weight. The adapter seam is where they'd slot in.",
    ],
  },
  {
    q: "What happens if the device disconnects mid-test?",
    tag: "failure modes",
    a: [
      "The adapter raises a typed error — ConnectionTimeoutError or CommandError, both under DeviceError. Tests either assert on that (negative suite) or fail with a precise message that names the device and operation, because the logger adapter attaches device/operation context to every record.",
      "Session lifecycle is handled by fixtures: connect in setup, disconnect in teardown, and disconnect() is idempotent so a double-close after a crash is safe. The orchestrator's finally-block guarantees the session is released even when a suite raises.",
    ],
  },
  {
    q: "How do you measure packet loss?",
    tag: "metrics",
    a: [
      "Transmitted and received frame counters come from the traffic generator's statistics object; loss is (tx − rx) / tx × 100, computed in metrics.py, which refuses impossible input (sent ≤ 0, received > sent) by raising MetricsError instead of returning a garbage number.",
      "In the simulator the rx counter comes from a Bernoulli (or burst/Gilbert-style) drop process driven by the seeded RNG. On real hardware the same function consumes the generator's hardware counters — that's the point of keeping the math ignorant of the source.",
    ],
  },
  {
    q: "How would you integrate Ixia?",
    tag: "hardware path",
    a: [
      "I'd write an IxiaAdapter implementing TrafficGenerator over the ixnetwork REST API: configure_stream() creates a topology + traffic item mapped from StreamConfig, start()/stop() drive traffic state, get_statistics() polls the flow statistics view and converts it into the same TrafficStats dataclass.",
      "Nothing above the interface changes: tests, thresholds, and metrics keep working because they only ever see TrafficStats. I have not used Ixia hardware — the repo states that plainly — but the seam exists precisely so that integration is additive, not invasive.",
    ],
  },
  {
    q: "How would you test this against a real switch?",
    tag: "hardware path",
    a: [
      "Three phases. First, a replay adapter: record real 'show mac address-table' / 'show interfaces counters' output and feed it through fixtures, so parsing and assertions run against truth without a rack.",
      "Second, one real device behind an SshAdapter (Netmiko or paramiko channel, never shell=True): run the functional suite with --environment physical and a physical lab.yaml. Expect to iterate on output parsing — that's exactly what the simulator can't teach you.",
      "Third, wire the traffic generator's stats to whatever the lab has — iperf3 endpoints, or a real Ixia/virtex if available — keeping the threshold mechanism identical.",
    ],
  },
  {
    q: "How would you scale this to hundreds of devices?",
    tag: "scale",
    a: [
      "The bottleneck is serial connection setup. DeviceManager.connect_all() becomes an asyncio.gather over adapters with bounded concurrency, and pytest-xdist groups tests per device so suites fan out across workers.",
      "Configuration stays the lever: lab.yaml already describes N devices declaratively, and a topology generator (spine-leaf template → YAML) means 200 devices is generated, not typed. Results stay per-run JSON, which trivially shards.",
    ],
  },
  {
    q: "How does CI execute the tests?",
    tag: "ci/cd",
    a: [
      "GitHub Actions: checkout → setup-python (3.11 and 3.12 matrix) → pip install -e '.[dev]' → ruff → mypy → pytest -m unit with coverage → the functional/negative/regression markers → performance/integration markers → coverage gate at 85% → artifact upload with if: always().",
      "The matrix is deliberately small: 3.11 is the declared floor, 3.12 is current stable. Each stage writes its own junitxml, so a failed artifact name tells you which stage died before you open a log.",
    ],
  },
  {
    q: "How do you prevent flaky tests?",
    tag: "reliability",
    a: [
      "Three rules. One: every stochastic element is seeded (--seed, default 0x5EED), so a failing run is reproducible bit-for-bit. Two: state isolation — an autouse fixture resets every device between tests, so ordering never matters. Three: assertions target stable properties (counter deltas, table membership, raised types) instead of wall-clock timing.",
      "Performance thresholds live in lab.yaml, so if an environment genuinely runs slower you adjust the environment's budget in config — you don't loosen test code, and the change is visible in review.",
    ],
  },
  {
    q: "How would you debug a failing test?",
    tag: "debugging",
    a: [
      "Start from the JSON artifact, not the console: results.json pins seed, suite, and per-test status, so I re-run locally with pytest --seed=0x… -k test_name and get the identical scenario.",
      "Then the structured logs: every line carries test, device and operation fields, so 'what did sw-acc-02 see during test_vlan_isolation' is a one-line grep, not log archaeology. If the simulation itself is suspect, the seed makes its entire stream reproducible, and I diff metrics across two seeds to separate logic bugs from model noise.",
    ],
  },
];
