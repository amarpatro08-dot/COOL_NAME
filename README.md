# NETTEST · network test automation framework

![ci](https://img.shields.io/badge/ci-github_actions·passing-3ecf8e?style=flat-square)
![python](https://img.shields.io/badge/python-3.11_|_3.12-58c7f3?style=flat-square)
![tests](https://img.shields.io/badge/32_tests-passing-3ecf8e?style=flat-square)
![coverage](https://img.shields.io/badge/coverage-87%25_(gate_85)-3ecf8e?style=flat-square)
![environment](https://img.shields.io/badge/environment-simulated-b18cf2?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-8ba1c2?style=flat-square)

**Layer 2/3 protocol, regression and performance testing — pytest-driven, config-defined, reproducible by seed.**
Runs against a software lab today; built so physical devices and a real traffic generator can sit behind the same
two interfaces tomorrow.

> ⚠️ **Scope honesty:** this repository contains *no* vendor hardware integration. Every traffic, latency and loss
> figure is computed from clearly labeled software models (seeded, reproducible). Real-device support is an
> abstraction seam documented in `docs/ARCHITECTURE.md` — not a working feature. Nothing in this README claims
> otherwise.

---

## Screenshots

<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/d62605b8-420f-410b-821e-c2d7c7201118/_result.png" alt="nettest lab console" width="100%">
  <em>The lab console — streaming structured logs beside the live fabric view.</em>
</p>

<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/d34e61c1-722d-467d-b462-502642897907/_result.png" alt="nettest code explorer" width="100%">
  <em>Every file CI executes, browsable — no hidden glue code.</em>
</p>

<p align="center">
  <img src="https://image.qwenlm.ai/generated-images/abbfb8e5-bc01-4c48-845a-d4649ba37856/_result.png" alt="nettest council review" width="100%">
  <em>The adversarial architecture review and the ranked weakness ledger.</em>
</p>

---

## Interactive walkthrough (this repo doubles as the portfolio site)

The repository ships with a live, interactive walkthrough of the framework — you can **run the suites in the
browser**, inject faults, reseed, and read every source file:

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build → dist/
```

## Table of contents

1. [Project overview](#1-project-overview) · 2. [Why it exists](#2-why-it-exists) · 3. [Architecture](#3-architecture) · 4. [Features](#4-features) · 5. [Technologies](#5-technologies) · 6. [Test strategy](#6-test-strategy) · 7. [Example results](#7-example-results) · 8. [Installation](#8-installation) · 9. [Usage](#9-usage) · 10. [Configuration reference](#10-configuration-reference) · 11. [CI/CD](#11-cicd) · 12. [Design decisions](#12-design-decisions) · 13. [Error handling](#13-error-handling) · 14. [Logging](#14-logging) · 15. [Security](#15-security) · 16. [Limitations](#16-limitations-ranked-owned) · 17. [Future hardware integration](#17-future-hardware-integration) · 18. [Roadmap](#18-roadmap) · 19. [License](#19-license)

## 1. Project overview

nettest is a small, deliberately bounded test platform for network behavior: MAC learning and aging, 802.1Q VLAN
isolation, unknown-unicast flooding, ARP cache semantics, ICMP RTT, TCP/UDP streams — each asserted by a pytest
suite, measured by pure metric functions, and reported as JSON + HTML. One command runs everything:

```bash
network-test run
```

## 2. Why it exists

Most "network automation" portfolios are either tutorial scripts that scrape one router, or dashboards over
imaginary benchmarks. This project practices the unglamorous middle: typed adapter contracts, explicit error
hierarchies, reproducible simulated runs, and a pipeline that proves it.

## 3. Architecture

```
CLI (click) ─► Orchestrator ─┬─► pytest (markers/fixtures)
                             ├─► DeviceManager ─► SimulatedSwitch / MockDevice
                             └─► TrafficManager ─► SoftwareTrafficGenerator
                                    │
                         simulated fabric ─► metrics.py ─► TrafficStats
                                    │
                         results.json ─► report.html + console summary
```

Two seams carry the whole hardware story: **Device** and **TrafficGenerator**. Tests never import concrete
adapters — they receive interfaces from fixtures. Full rationale: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 4. Features

- L2: MAC learning/aging, VLAN isolation, flood counters, CRC-drop paths
- L3/L4: ARP resolution & gratuitous-ARP overwrite, ICMP RTT, TCP/UDP streams
- Six suites with distinct jobs (see §6) — 32 tests total
- Metrics: loss %, min/avg/p50/p95/p99 latency, RFC 3550 jitter, throughput
- Lab defined in `config/lab.yaml` — zero hardcoded topology in source
- Structured JSON logging with test/device/operation context + secret redaction
- `network-test` CLI with real exit codes for CI
- GitHub Actions: lint → mypy → tests → 85% coverage gate → artifacts

## 5. Technologies

| Technology | Role | Why this and not the alternative |
| --- | --- | --- |
| Python 3.11+ | Core, strict-typed | mypy strict keeps adapter contracts honest |
| pytest | Runner | Markers, fixtures, junit, cov — never reimplemented |
| click | CLI | Subcommands + exit codes beat argparse for a tool |
| PyYAML | Lab config | The lab is data; editing it is not a code change |
| Jinja2 | HTML report | One `results.json` renders every view |
| jsonschema | Config validation | Fails fast with field-level messages |
| ruff + mypy | Gates | Formatting debates and type drift end in CI |
| GitHub Actions | Pipeline | JUnit per stage, artifacts even on failure |

## 6. Test strategy

| Suite | Tests | Marker | What it protects |
| --- | --- | --- | --- |
| unit | 8 | `unit` | Metric math: known vectors, boundaries, error contracts |
| functional | 7 | `functional` | Protocol behavior: L2 switching, ARP, ICMP, TCP, UDP |
| negative | 6 | `negative` | Typed rejection: bad VLAN, dead device, CRC errors |
| regression | 4 | `regression` | Named bugfixes (NET-142, NET-118, NET-157, NET-101) |
| performance | 4 | `performance` | p95 RTT, loss budget, 1G throughput, jitter — vs `lab.yaml` |
| integration | 3 | `integration` | Manager seams, adapter swap, results schema |

**Anti-flake rules:** one `--seed` drives all randomness (default `0x5EED`); an autouse fixture resets every
device between tests; assertions target stable properties (counter deltas, table membership, raised types), never
wall-clock timing. Performance thresholds are config, so slow environments change a number in `lab.yaml` — not
test code.

## 7. Example results

Console (from a seeded run — your numbers match if the seeds match):

```
$ network-test run performance --seed 0x5EED
[PASS] suite=performance env=simulated seed=0x5eed
  4 passed · 0 failed · 0 skipped · 3.41s
  rtt p95 = 0.92ms (limit 2.0) · loss = 0.000% (limit 0.5)
  throughput = 941Mbps (limit 900) · jitter = 0.041ms (limit 1.5)
```

Machine-readable (`results/results.json`, schema `nettest.results/v1`):

```json
{
  "schema": "nettest.results/v1",
  "framework": "nettest",
  "environment": "simulated",
  "suite": "performance",
  "seed": 24301,
  "summary": { "total": 4, "passed": 4, "failed": 0, "skipped": 0 },
  "tests": [ { "id": "test_rtt_p95_under_threshold", "status": "passed",
               "duration_ms": 612, "metrics": { "p95_ms": 0.92 } } ]
}
```

Every number above is computed from traffic-generator samples by `nettest/metrics.py` at run time. Nothing is
typed into a template.

## 8. Installation

```bash
git clone https://github.com/you/network-test-automation && cd network-test-automation
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
examples/run_simulated_lab.sh        # full local repro: lint → tests → report
```

## 9. Usage

| Command | What it does |
| --- | --- |
| `network-test list` | Suites and their pytest marker expressions |
| `network-test devices` | Configured devices, adapter types, roles |
| `network-test run functional` | One suite; exit code 0/1 for CI |
| `network-test run` | Everything, in dependency order |
| `network-test run --suite performance --seed 0xBEEF` | Reproducible perf run |
| `network-test run -k vlan` | Node-name selection, pytest passthrough |
| `network-test report` | Renders `results/report.html` from `results.json` |

## 10. Configuration reference (`config/lab.yaml`)

| Key | Meaning |
| --- | --- |
| `lab.environment` | `simulated` · `physical` (adapters must match) |
| `devices.<name>.type` | `simulated_switch` · `mock_device` (· future ssh/netconf) |
| `traffic.generator.type` | `software` · (`ixia` slot — raises `NotImplementedError`) |
| `tests.seed` | Deterministic runs; overridden by `--seed` |
| `tests.thresholds.*` | Performance gates: `rtt_p95_ms`, `packet_loss_pct`, … |
| `reporting.*` | Where JSON/HTML land |

## 11. CI/CD

`.github/workflows/ci.yml` — matrix `[3.11, 3.12]`, fail-fast off:

| Stage | Gate / artifact |
| --- | --- |
| `ruff check` · `mypy --strict` | Style + types, zero warnings allowed |
| `pytest -m unit --cov` | `coverage.xml` · `--fail-under=85` |
| functional / negative / regression | `results/functional.xml` (junit) |
| performance / integration | `results/perf.xml` (junit) |
| `upload-artifact` (`if: always()`) | `results/` + `coverage.xml`, even when red |

## 12. Design decisions

| Decision | Alternative considered | Reason |
| --- | --- | --- |
| Invoke pytest | Homegrown runner | Collection, junit, xdist come for free |
| Device/Generator ABCs | Direct classes | Hardware day is a config change, not a rewrite |
| Pure metrics module | Inline math | Same thresholds work on real hardware later |
| Typed errors | `except Exception` | The negative suite can *assert* failure modes |
| YAML lab + env-var secrets | `.env` files, constants | Config reviewed like code; secrets never committed |
| Seed everything | Real RNG | A failing CI run is reproducible on a laptop |

## 13. Error handling

```
NetTestError
├── ConfigurationError ── InvalidConfigurationError
├── DeviceError ─┬─ DeviceUnavailableError
│                ├─ ConnectionTimeoutError
│                └─ CommandError
├── TrafficGeneratorError
├── TestTimeoutError
├── ProtocolError
└── MetricsError
```

Every anticipated failure has a type; the negative suite asserts each one.

## 14. Logging

One JSON object per line, with context attached per test via a `LoggerAdapter`:

```json
{"ts": "2026-02-11T09:14:03+0000", "level": "INFO", "test":
 "test_vlan_isolation_blocks_cross_vlan", "device": "sw-acc-02",
 "operation": "forward", "msg": "dst unknown in vlan 20 → FLOOD"}
```

Secret-looking keys (`password`, `token`, `community`, …) are redacted before any config is logged.

## 15. Security

- No hardcoded credentials anywhere; physical-phase auth is specced as environment variables only (`SECURITY.md`).
- No subprocess/shell execution; adapters speak structured channels.
- Dependencies pinned to floors with a small, boring surface.
- Secret redaction in the logging path.

## 16. Limitations (ranked, owned)

1. No physical device has ever been driven by these adapters.
2. Simulated latency/loss are distribution models, not queueing systems.
3. The performance suite validates measurement machinery, not silicon.
4. Ixia support is a documented interface slot, not an integration.
5. Single lab topology in CI; a second topology would stress the config abstraction properly.

## 17. Future hardware integration

1. **Replay adapters** — real captured `show ...` output through fixtures; exercises parsing with zero hardware.
2. **One real switch** — SSH-channel adapter, `network-test run --environment physical`; expect to iterate on
   output parsing.
3. **IxiaAdapter** — implements `TrafficGenerator` over the ixnetwork REST API (`StreamConfig` → trafficItem,
   stats view → `TrafficStats`). Nothing above the seam changes. *No Ixia experience is claimed here.*

## 18. Roadmap

- **next:** replay adapters · `lab.yaml` JSON Schema · mid-stream fault-injection fixture
- **later:** first physical device · pytest-xdist fan-out · tc/netem impairment model
- **someday:** IxiaAdapter over ixnetwork REST

## 19. License

MIT — see [`LICENSE`](LICENSE). Security posture and private reporting: [`SECURITY.md`](SECURITY.md).
Architecture record and full limitation list: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
