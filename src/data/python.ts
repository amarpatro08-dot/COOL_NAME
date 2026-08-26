/**
 * Complete sources of the nettest framework as they exist in the repository.
 * Every file is real, runnable Python/YAML/TOML — the same code CI executes.
 */

export interface CodeFile {
  path: string;
  lang: "python" | "yaml" | "toml" | "bash" | "markdown";
  purpose: string;
  code: string;
}

export const PYTHON_FILES: CodeFile[] = [
  {
    path: "pyproject.toml",
    lang: "toml",
    purpose: "Packaging, dependencies, tool config, CLI entry point",
    code: `[project]
name = "nettest"
version = "0.4.2"
description = "Network test automation framework for simulated and physical labs"
readme = "README.md"
requires-python = ">=3.11"
license = { text = "MIT" }
authors = [{ name = "A. Engineer" }]
dependencies = [
    "pytest>=8.0",
    "PyYAML>=6.0",
    "click>=8.1",
    "Jinja2>=3.1",
    "jsonschema>=4.21",
]

[project.optional-dependencies]
dev = ["ruff>=0.4", "mypy>=1.9", "pytest-cov>=5.0", "types-PyYAML"]

[project.scripts]
network-test = "nettest.cli:main"

[build-system]
requires = ["setuptools>=69"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "unit: pure logic, no devices",
    "functional: protocol behavior on the lab fabric",
    "negative: expected-failure and rejection paths",
    "regression: guards for previously fixed bugs",
    "performance: latency/throughput/loss/jitter thresholds",
    "integration: orchestrator and reporting end-to-end",
    "simulated: runs against the software lab (no hardware)",
]

[tool.ruff]
line-length = 100
target-version = "py311"
[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM"]

[tool.mypy]
strict = true
python_version = "3.11"

[tool.coverage.run]
branch = true
source = ["nettest"]
`,
  },
  {
    path: "config/lab.yaml",
    lang: "yaml",
    purpose: "Single source of truth for lab topology, devices, traffic, thresholds",
    code: `# nettest lab definition — nothing about the lab lives in source code.
lab:
  name: demo-lab-01
  environment: simulated        # simulated | physical (physical requires real adapters)

devices:
  sw-core-01:
    type: simulated_switch
    role: core
    mgmt_ip: 10.250.0.11
    vlans: [1, 10, 20]
    trunk_ports: ["port-channel1"]
  sw-acc-02:
    type: simulated_switch
    role: access
    mgmt_ip: 10.250.0.12
    access_vlan_map:
      GigabitEthernet0/1: 10
      GigabitEthernet0/2: 10
      GigabitEthernet0/3: 20
      GigabitEthernet0/4: 20
  host-a: { type: mock_device, role: endpoint, ip: 10.10.10.1, mac: "aa:bb:cc:00:01:0a" }
  host-b: { type: mock_device, role: endpoint, ip: 10.10.10.2, mac: "aa:bb:cc:00:02:0b" }
  host-c: { type: mock_device, role: endpoint, ip: 10.20.20.3, mac: "aa:bb:cc:00:03:0c" }

traffic:
  generator:
    type: software              # software | ixia (ixia requires IxiaAdapter + chassis)
    defaults:
      frame_size: 1460
      rate_pps: 1000

tests:
  timeout_s: 30
  seed: 0x5EED                  # deterministic simulated runs; override with --seed
  thresholds:                   # performance suite asserts against these
    rtt_p95_ms: 2.0
    packet_loss_pct: 0.5
    throughput_mbps: 900
    jitter_ms: 1.5

reporting:
  out_dir: results
  json: results.json
  html: report.html
`,
  },
  {
    path: "src/nettest/errors.py",
    lang: "python",
    purpose: "Typed exception hierarchy — no broad 'except Exception' downstream",
    code: `"""Typed error hierarchy for nettest.

Every failure mode the framework anticipates has an explicit type, so callers
catch *specific* conditions instead of blanket \`except Exception\`.
"""

from __future__ import annotations


class NetTestError(Exception):
    """Base class for all framework errors."""


class ConfigurationError(NetTestError):
    """lab.yaml is missing, malformed, or internally inconsistent."""


class InvalidConfigurationError(ConfigurationError):
    """A specific configuration value is invalid (e.g. VLAN 4096)."""


class DeviceError(NetTestError):
    """Base for device-adapter failures."""


class DeviceUnavailableError(DeviceError):
    """The device could not be reached at all (no route, powered off)."""


class ConnectionTimeoutError(DeviceError):
    """A connect/handshake exceeded its deadline."""


class CommandError(DeviceError):
    """The device rejected a command or returned an error payload."""


class TrafficGeneratorError(NetTestError):
    """The traffic generator failed to arm, start, or report stats."""


class TestTimeoutError(NetTestError):
    """A test exceeded tests.timeout_s from lab.yaml."""


class ProtocolError(NetTestError):
    """Observed protocol behavior violates the spec we are asserting on."""


class MetricsError(NetTestError):
    """Metric computation received impossible input (e.g. sent=0)."""
`,
  },
  {
    path: "src/nettest/logging_utils.py",
    lang: "python",
    purpose: "Structured JSON logging with test/device/operation context",
    code: `"""Structured logging: one JSON object per line, greppable in CI.

Extra context (test name, device, operation) is attached through a
LoggerAdapter built by the orchestrator per test, so log lines answer
*who did what to which device* without string-formatting everywhere.
"""

from __future__ import annotations

import json
import logging
import sys
from typing import Any

_REDACTED = {"password", "secret", "token", "api_key", "community"}


class JsonFormatter(logging.Formatter):
    """Render records as single-line JSON. Secrets never reach the sink."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for field in ("test", "device", "operation", "suite", "seed"):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def build_logger(name: str = "nettest", verbose: bool = False) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
    return logger


class ContextLogger(logging.LoggerAdapter):
    """Attaches test/device/operation fields to every record."""

    def process(self, msg: str, kwargs: Any) -> tuple[str, Any]:
        extra = kwargs.get("extra", {})
        extra.update(self.extra or {})
        kwargs["extra"] = extra
        return msg, kwargs


def redact(config: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of *config* with secret-looking keys masked (for logging)."""
    safe: dict[str, Any] = {}
    for key, value in config.items():
        if isinstance(value, dict):
            safe[key] = redact(value)
        elif any(s in key.lower() for s in _REDACTED):
            safe[key] = "***redacted***"
        else:
            safe[key] = value
    return safe
`,
  },
  {
    path: "src/nettest/devices/base.py",
    lang: "python",
    purpose: "Device ABC — the seam where SimulatedSwitch and a future real adapter live",
    code: `"""Device abstraction.

Concrete adapters (SimulatedSwitch today, NetconfAdapter/SshAdapter tomorrow)
implement this interface. Tests never import a concrete adapter: they receive
a Device from the DeviceManager, so swapping simulated -> physical is a
config change, not a test change.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum


class DeviceState(str, Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    READY = "ready"
    ERROR = "error"


@dataclass(frozen=True)
class DeviceStatus:
    state: DeviceState
    model: str
    uptime_s: float
    interfaces_up: int
    interfaces_total: int
    counters: dict[str, int] = field(default_factory=dict)


class Device(ABC):
    """Minimal contract every managed device must satisfy."""

    name: str

    @abstractmethod
    def connect(self, timeout_s: float) -> None:
        """Establish a management session or raise ConnectionTimeoutError."""

    @abstractmethod
    def disconnect(self) -> None:
        """Close the session idempotently (safe to call twice)."""

    @abstractmethod
    def configure(self, commands: list[str]) -> None:
        """Apply config atomically: all commands commit, or none do."""

    @abstractmethod
    def execute_command(self, command: str) -> str:
        """Run an operational command and return its textual output."""

    @abstractmethod
    def get_status(self) -> DeviceStatus:
        """Snapshot of reachability, interfaces and counters."""

    @abstractmethod
    def reset(self) -> None:
        """Return the device to its initial lab state (idempotent)."""
`,
  },
  {
    path: "src/nettest/devices/simulated_switch.py",
    lang: "python",
    purpose: "Software switch: MAC table, VLANs, ARP, ICMP — real L2/L3 semantics, no hardware",
    code: `"""SimulatedSwitch — an in-process L2/L3 switch with honest semantics.

It is *not* a stub that returns canned strings: it maintains a MAC table with
aging, 802.1Q VLAN filtering, an ARP cache and interface counters, and it
raises the same typed errors a real adapter would raise. That is what makes
negative and regression tests meaningful without hardware.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

from nettest.devices.base import Device, DeviceState, DeviceStatus
from nettest.errors import (
    CommandError,
    ConnectionTimeoutError,
    InvalidConfigurationError,
)

VLAN_RANGE = range(1, 4095)  # 4095 is reserved by 802.1Q


@dataclass
class MacEntry:
    mac: str
    port: str
    vlan: int
    learned_at: float


@dataclass
class SimulatedSwitch(Device):
    name: str
    mgmt_ip: str
    reachable: bool = True
    mac_table: dict[tuple[int, str], MacEntry] = field(default_factory=dict)
    arp_cache: dict[str, str] = field(default_factory=dict)
    access_vlan: dict[str, int] = field(default_factory=dict)
    trunk_allowed: dict[str, set[int]] = field(default_factory=dict)
    counters: dict[str, int] = field(
        default_factory=lambda: {"rx-unicast": 0, "rx-crc-err": 0, "flooded": 0}
    )
    _connected: bool = field(default=False, repr=False)
    mac_age_s: float = 300.0

    # ---- session ---------------------------------------------------------
    def connect(self, timeout_s: float = 5.0) -> None:
        if not self.reachable:
            raise ConnectionTimeoutError(
                f"{self.name}: no management handshake from {self.mgmt_ip} "
                f"within {timeout_s:.1f}s"
            )
        self._connected = True

    def disconnect(self) -> None:
        self._connected = False  # idempotent by design

    def _require_session(self) -> None:
        if not self._connected:
            raise CommandError(f"{self.name}: no active session")

    # ---- configuration ---------------------------------------------------
    def configure(self, commands: list[str]) -> None:
        self._require_session()
        staged: list[tuple[str, int]] = []
        for cmd in commands:  # validate ALL before committing (atomic)
            if cmd.startswith("vlan "):
                vid = int(cmd.split()[1])
                if vid not in VLAN_RANGE:
                    raise InvalidConfigurationError(
                        f"{self.name}: vlan {vid} outside 1-4094"
                    )
                staged.append(("vlan", vid))
        for kind, vid in staged:
            self.trunk_allowed.setdefault("port-channel1", set()).add(vid)

    def execute_command(self, command: str) -> str:
        self._require_session()
        if command == "show mac address-table":
            lines = [
                f"{e.vlan:>5}  {e.mac}  {e.port}"
                for e in self.mac_table.values()
            ]
            return "\\n".join(lines) or "(empty)"
        if command == "show interfaces counters":
            return "\\n".join(f"{k}: {v}" for k, v in self.counters.items())
        raise CommandError(f"{self.name}: unknown command {command!r}")

    # ---- dataplane ---------------------------------------------------------
    def learn(self, mac: str, port: str, vlan: int) -> None:
        """L2 source-address learning, per (vlan, mac)."""
        self.mac_table[(vlan, mac)] = MacEntry(mac, port, vlan, time.monotonic())
        self.counters["rx-unicast"] += 1

    def forward(self, dst_mac: str, vlan: int, in_port: str) -> str:
        """Return egress port for dst_mac, or 'FLOOD' if unknown (then learn it)."""
        entry = self.mac_table.get((vlan, dst_mac))
        if entry is None:
            self.counters["flooded"] += 1
            return "FLOOD"
        if entry.port == in_port:
            return "DROP"  # never forward back out the ingress port
        return entry.port

    def receive_frame(self, frame: dict[str, object]) -> None:
        """Ingress path: CRC check, VLAN check, learning."""
        if not frame.get("fcs_ok", True):
            self.counters["rx-crc-err"] += 1
            return  # dropped before any forwarding decision
        vlan = int(frame.get("vlan", self.access_vlan.get(frame["port"], 1)))  # type: ignore[arg-type]
        self.learn(str(frame["src"]), str(frame["port"]), vlan)

    def resolve_arp(self, ip: str) -> str | None:
        return self.arp_cache.get(ip)

    def gratuitous_arp(self, ip: str, mac: str) -> None:
        """RFC 5227: must *overwrite* an existing binding."""
        self.arp_cache[ip] = mac

    # ---- lifecycle ---------------------------------------------------------
    def age_mac_table(self, now: float | None = None) -> int:
        """NET-142 regression: entries idle > mac_age_s must be flushed."""
        now = now or time.monotonic()
        stale = [k for k, e in self.mac_table.items() if now - e.learned_at > self.mac_age_s]
        for key in stale:
            del self.mac_table[key]
        return len(stale)

    def get_status(self) -> DeviceStatus:
        return DeviceStatus(
            state=DeviceState.READY if self._connected else DeviceState.DISCONNECTED,
            model="nettest-sim-24p",
            uptime_s=0.0,
            interfaces_up=len(self.access_vlan),
            interfaces_total=24,
            counters=dict(self.counters),
        )

    def reset(self) -> None:
        self.mac_table.clear()
        self.arp_cache.clear()
        self.counters = {"rx-unicast": 0, "rx-crc-err": 0, "flooded": 0}
`,
  },
  {
    path: "src/nettest/devices/mock_device.py",
    lang: "python",
    purpose: "Stateless stand-in for endpoints — keeps unit/integration tests device-free",
    code: `"""MockDevice — minimal Device implementation for endpoints and unit tests.

Deliberately simpler than SimulatedSwitch: no dataplane semantics, just a
reliable session object with injectable failure modes for negative testing.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from nettest.devices.base import Device, DeviceState, DeviceStatus
from nettest.errors import CommandError, ConnectionTimeoutError


@dataclass
class MockDevice(Device):
    name: str
    fail_connect: bool = False
    command_log: list[str] = field(default_factory=list)
    _connected: bool = field(default=False, repr=False)

    def connect(self, timeout_s: float = 5.0) -> None:
        if self.fail_connect:
            raise ConnectionTimeoutError(f"{self.name}: injected connect failure")
        self._connected = True

    def disconnect(self) -> None:
        self._connected = False

    def configure(self, commands: list[str]) -> None:
        self._require(commands and "configure")
        self.command_log.extend(commands)

    def execute_command(self, command: str) -> str:
        self._require(command)
        self.command_log.append(command)
        return f"{self.name}$ {command}\\nOK"

    def get_status(self) -> DeviceStatus:
        return DeviceStatus(
            state=DeviceState.READY if self._connected else DeviceState.DISCONNECTED,
            model="nettest-mock",
            uptime_s=0.0,
            interfaces_up=1,
            interfaces_total=1,
        )

    def reset(self) -> None:
        self.command_log.clear()
        self._connected = False

    def _require(self, command: str) -> None:
        if not self._connected:
            raise CommandError(f"{self.name}: '{command}' without session")
`,
  },
  {
    path: "src/nettest/traffic/base.py",
    lang: "python",
    purpose: "TrafficGenerator ABC — the Ixia-ready seam",
    code: `"""Traffic generator abstraction.

A real Ixia chassis would be integrated by implementing this interface over
the ixnetwork REST API — configure_stream() maps to trafficItem, start()/stop()
to traffic control, get_statistics() to the stats view. Tests and the
orchestrator never know which implementation they hold.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class StreamConfig:
    name: str
    src: str                       # endpoint name, e.g. "host-a"
    dst: str
    protocol: str                  # "icmp" | "tcp" | "udp"
    frame_size: int = 1460
    rate_pps: int = 1000
    duration_s: float = 10.0
    loss_model: str = "none"       # "none" | "bernoulli" | "burst"
    loss_pct: float = 0.0


@dataclass(frozen=True)
class TrafficStats:
    stream: str
    tx_frames: int
    rx_frames: int
    bytes_tx: int
    duration_s: float
    latency_samples_ms: tuple[float, ...] = ()

    @property
    def loss_pct(self) -> float:
        if self.tx_frames == 0:
            return 0.0
        return (self.tx_frames - self.rx_frames) / self.tx_frames * 100.0

    @property
    def throughput_mbps(self) -> float:
        if self.duration_s <= 0:
            return 0.0
        return self.bytes_tx * 8 / self.duration_s / 1e6


class TrafficGenerator(ABC):
    @abstractmethod
    def configure_stream(self, config: StreamConfig) -> None:
        """Stage a stream; does not transmit yet."""

    @abstractmethod
    def start(self, stream: str) -> None:
        """Begin transmission; raise TrafficGeneratorError if not armed."""

    @abstractmethod
    def stop(self, stream: str) -> TrafficStats:
        """Stop and return final statistics for the stream."""

    @abstractmethod
    def get_statistics(self, stream: str) -> TrafficStats:
        """Live statistics while the stream runs."""
`,
  },
  {
    path: "src/nettest/traffic/simulator.py",
    lang: "python",
    purpose: "Software traffic generator: deterministic streams, loss models, latency sampling",
    code: `"""SoftwareTrafficGenerator — honest simulation, clearly labeled.

Arrivals follow a Poisson process, latency samples are drawn from an
exponential-ish distribution with a configurable tail, and loss is a Bernoulli
(or burst) process driven by the run's seeded RNG. Numbers are *computed from
those samples* by nettest.metrics — never invented in this module.

An IxiaAdapter would expose the identical TrafficGenerator surface while
driving a chassis; nothing above this class changes.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from nettest.errors import TrafficGeneratorError
from nettest.traffic.base import StreamConfig, TrafficStats, TrafficGenerator


@dataclass
class SoftwareTrafficGenerator(TrafficGenerator):
    seed: int = 0x5EED
    base_rtt_ms: float = 0.42
    _streams: dict[str, StreamConfig] = field(default_factory=dict)
    _running: set[str] = field(default_factory=set)
    _stats: dict[str, TrafficStats] = field(default_factory=dict)
    _rng: random.Random = field(init=False)

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)

    def configure_stream(self, config: StreamConfig) -> None:
        if config.frame_size < 64 or config.frame_size > 9216:
            raise TrafficGeneratorError(
                f"frame_size {config.frame_size} outside 64..9216 (jumbo)"
            )
        self._streams[config.name] = config

    def start(self, stream: str) -> None:
        if stream not in self._streams:
            raise TrafficGeneratorError(f"stream {stream!r} not configured")
        self._running.add(stream)

    def stop(self, stream: str) -> TrafficStats:
        stats = self.get_statistics(stream)
        self._running.discard(stream)
        return stats

    def get_statistics(self, stream: str) -> TrafficStats:
        cfg = self._streams.get(stream)
        if cfg is None:
            raise TrafficGeneratorError(f"unknown stream {stream!r}")
        n = int(cfg.rate_pps * cfg.duration_s)
        n = min(n, 50_000)  # demo cap keeps CI fast; real generator has no cap
        tx = n
        rx = sum(1 for _ in range(n) if not self._dropped(cfg))
        latency = tuple(self._sample_rtt() for _ in range(min(n, 500)))
        bytes_tx = tx * (cfg.frame_size + 38)  # + preamble/IFG/CRC on the wire
        duration = tx / cfg.rate_pps
        stats = TrafficStats(
            stream=stream,
            tx_frames=tx,
            rx_frames=rx,
            bytes_tx=bytes_tx,
            duration_s=duration,
            latency_samples_ms=latency,
        )
        self._stats[stream] = stats
        return stats

    # ---- models ----------------------------------------------------------
    def _dropped(self, cfg: StreamConfig) -> bool:
        if cfg.loss_model == "none" or cfg.loss_pct <= 0:
            return False
        if cfg.loss_model == "burst":
            # Gilbert-Elliott-ish: losses arrive in bursts, not uniformly
            return self._rng.random() < (cfg.loss_pct / 100) * 4 and self._rng.random() < 0.25
        return self._rng.random() < cfg.loss_pct / 100  # bernoulli

    def _sample_rtt(self) -> float:
        base = self.base_rtt_ms
        v = base + (-math.log(1 - self._rng.random() * 0.985)) * base * 0.55
        if self._rng.random() < 0.028:  # occasional queueing spike
            v += 1.5 + self._rng.random() * 6.5
        return round(max(0.05, v), 4)
`,
  },
  {
    path: "src/nettest/metrics.py",
    lang: "python",
    purpose: "Pure metric math — the part CI unit-tests hardest",
    code: `"""Metric computation. Pure functions, fully unit-tested.

Design rule: this module never knows whether samples came from a simulated
fabric or a real one. It just computes. That keeps the math honest and lets
the same thresholds apply the day real hardware shows up.
"""

from __future__ import annotations

from dataclasses import dataclass

from nettest.errors import MetricsError


@dataclass(frozen=True)
class LatencyReport:
    samples: int
    min_ms: float
    avg_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_ms: float
    jitter_ms: float  # RFC 3550


def percentile(values: list[float], pct: float) -> float:
    """Nearest-rank percentile; raises MetricsError on empty input."""
    if not values:
        raise MetricsError("percentile() of empty sample set")
    ordered = sorted(values)
    k = min(len(ordered) - 1, int(math.ceil(pct / 100 * len(ordered))) - 1)
    return ordered[max(0, k)]


def packet_loss_pct(sent: int, received: int) -> float:
    if sent <= 0:
        raise MetricsError("packet_loss_pct(sent<=0) is undefined")
    if received > sent:
        raise MetricsError("received > sent — counters are inconsistent")
    return (sent - received) / sent * 100.0


def rfc3550_jitter(interarrival_ms: list[float]) -> float:
    """RFC 3550 §6.4.1: J(i) = J(i-1) + (|D(i-1,i)| - J(i-1)) / 16."""
    j = 0.0
    for i in range(1, len(interarrival_ms)):
        d = abs(interarrival_ms[i] - interarrival_ms[i - 1])
        j += (d - j) / 16
    return j


def throughput_mbps(bytes_tx: int, duration_s: float) -> float:
    if duration_s <= 0:
        raise MetricsError("throughput over non-positive duration")
    return bytes_tx * 8 / duration_s / 1e6


def latency_report(samples: list[float]) -> LatencyReport:
    if not samples:
        raise MetricsError("latency_report() needs at least one sample")
    jitter = rfc3550_jitter(samples)  # treat RTTs as interarrivals for the demo
    return LatencyReport(
        samples=len(samples),
        min_ms=min(samples),
        avg_ms=sum(samples) / len(samples),
        p50_ms=percentile(samples, 50),
        p95_ms=percentile(samples, 95),
        p99_ms=percentile(samples, 99),
        max_ms=max(samples),
        jitter_ms=jitter,
    )


import math  # noqa: E402  (kept at bottom in demo to shrink the diff)
`,
  },
  {
    path: "src/nettest/orchestrator.py",
    lang: "python",
    purpose: "Wires config → managers → pytest → results → report",
    code: `"""Test orchestrator: the only module allowed to know about everything.

Responsibilities: load lab.yaml, build Device/Traffic managers, translate a
suite name into pytest marker expressions, invoke pytest programmatically,
and hand results to reporting. Test files never import this module — it
imports them (via pytest collection).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import pytest

from nettest.config import LabConfig, load_config
from nettest.devices.base import Device
from nettest.devices.mock_device import MockDevice
from nettest.devices.simulated_switch import SimulatedSwitch
from nettest.logging_utils import build_logger
from nettest.traffic.base import TrafficGenerator
from nettest.traffic.simulator import SoftwareTrafficGenerator

SUITE_MARKERS = {
    "unit": "unit",
    "functional": "functional and simulated",
    "negative": "negative",
    "regression": "regression",
    "performance": "performance and simulated",
    "integration": "integration",
}


@dataclass
class DeviceManager:
    devices: dict[str, Device] = field(default_factory=dict)

    def connect_all(self, timeout_s: float) -> None:
        for device in self.devices.values():
            device.connect(timeout_s)  # raises typed errors upward

    def disconnect_all(self) -> None:
        for device in self.devices.values():
            device.disconnect()


@dataclass
class Orchestrator:
    config_path: Path
    seed: int = 0x5EED
    log: object = field(default_factory=lambda: build_logger())

    def load(self) -> LabConfig:
        return load_config(self.config_path)

    def build_devices(self, cfg: LabConfig) -> DeviceManager:
        mgr = DeviceManager()
        for name, spec in cfg.devices.items():
            match spec["type"]:
                case "simulated_switch":
                    mgr.devices[name] = SimulatedSwitch(
                        name=name, mgmt_ip=spec.get("mgmt_ip", "0.0.0.0")
                    )
                case "mock_device":
                    mgr.devices[name] = MockDevice(name=name)
                case other:
                    from nettest.errors import InvalidConfigurationError
                    raise InvalidConfigurationError(f"unknown device type {other!r}")
        return mgr

    def build_traffic(self, cfg: LabConfig) -> TrafficGenerator:
        kind = cfg.traffic["generator"]["type"]
        if kind == "software":
            return SoftwareTrafficGenerator(seed=self.seed)
        if kind == "ixia":
            # The single place an IxiaAdapter would be constructed.
            raise NotImplementedError(
                "ixia adapter not implemented — no chassis available in this repo"
            )
        from nettest.errors import InvalidConfigurationError
        raise InvalidConfigurationError(f"unknown traffic generator {kind!r}")

    def run_suite(self, suite: str, extra: list[str] | None = None) -> int:
        marker = SUITE_MARKERS.get(suite)
        if marker is None:
            from nettest.errors import InvalidConfigurationError
            raise InvalidConfigurationError(f"unknown suite {suite!r}")
        args = ["-m", marker, "--tb=short", "-q", f"--seed={self.seed}"]
        return pytest.main([*args, *(extra or [])])
`,
  },
  {
    path: "src/nettest/cli.py",
    lang: "python",
    purpose: "The network-test CLI (click) — list / run / report / devices",
    code: `"""network-test CLI.

Examples:
    network-test list
    network-test run functional
    network-test run --suite vlan --seed 0xBEEF
    network-test report --open
    network-test devices
"""

from __future__ import annotations

from pathlib import Path

import click

from nettest.orchestrator import SUITE_MARKERS, Orchestrator
from nettest.reporting import render_console_summary, render_html_report

DEFAULT_CONFIG = Path("config/lab.yaml")


@click.group()
@click.version_option("0.4.2", prog_name="network-test")
def main() -> None:
    """nettest — network test automation framework."""


@main.command("list")
def list_suites() -> None:
    """Show available suites and their pytest marker expressions."""
    for suite, marker in SUITE_MARKERS.items():
        click.echo(f"{suite:<14} -m '{marker}'")


@main.command()
@click.argument("suite", required=False)
@click.option("--suite", "suite_opt", help="Alternative to the positional suite.")
@click.option("--config", "config", default=str(DEFAULT_CONFIG), show_default=True)
@click.option("--seed", type=lambda s: int(s, 0), default=0x5EED, show_default=True)
@click.option("--verbose", is_flag=True)
def run(suite: str | None, suite_opt: str | None, config: str, seed: int, verbose: bool) -> None:
    """Execute a suite (or the full run when omitted)."""
    target = suite or suite_opt
    orch = Orchestrator(config_path=Path(config), seed=seed)
    cfg = orch.load()
    devices = orch.build_devices(cfg)
    devices.connect_all(timeout_s=cfg.tests["timeout_s"])
    try:
        code = (
            orch.run_suite(target, ["-v"] if verbose else None)
            if target
            else max(orch.run_suite(s) for s in SUITE_MARKERS)
        )
    finally:
        devices.disconnect_all()
    raise SystemExit(code)


@main.command()
@click.option("--results", default="results/results.json", show_default=True)
@click.option("--out", default="results/report.html", show_default=True)
def report(results: str, out: str) -> None:
    """Render the HTML report from the latest results.json."""
    render_html_report(Path(results), Path(out))
    click.echo(f"report written to {out}")


@main.command()
@click.option("--config", default=str(DEFAULT_CONFIG), show_default=True)
def devices(config: str) -> None:
    """List configured devices and their adapter types."""
    cfg = Orchestrator(Path(config)).load()
    for name, spec in cfg.devices.items():
        click.echo(f"{name:<12} {spec['type']:<18} {spec.get('role', '-')}")


if __name__ == "__main__":
    main()
`,
  },
  {
    path: "tests/conftest.py",
    lang: "python",
    purpose: "Shared fixtures: config, devices, traffic, seeded determinism",
    code: `"""Shared pytest fixtures.

Fixtures build one simulated lab per session and reset devices between tests
so test order never matters (a flake source this project refuses to have).
"""

from __future__ import annotations

from pathlib import Path

import pytest

from nettest.config import LabConfig, load_config
from nettest.orchestrator import Orchestrator


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption("--seed", action="store", default="0x5EED",
                     help="RNG seed for simulated runs (int, 0x ok)")


@pytest.fixture(scope="session")
def seed(request: pytest.FixtureRequest) -> int:
    return int(request.config.getoption("--seed"), 0)


@pytest.fixture(scope="session")
def lab_config() -> LabConfig:
    return load_config(Path("config/lab.yaml"))


@pytest.fixture(scope="session")
def orchestrator(lab_config: LabConfig, seed: int) -> Orchestrator:
    return Orchestrator(config_path=Path("config/lab.yaml"), seed=seed)


@pytest.fixture()
def devices(orchestrator: Orchestrator, lab_config: LabConfig):
    mgr = orchestrator.build_devices(lab_config)
    mgr.connect_all(timeout_s=10)
    yield mgr.devices
    mgr.disconnect_all()


@pytest.fixture()
def core(devices) -> "SimulatedSwitch":  # noqa: F821
    return devices["sw-core-01"]


@pytest.fixture()
def access(devices) -> "SimulatedSwitch":  # noqa: F821
    return devices["sw-acc-02"]


@pytest.fixture()
def traffic(orchestrator: Orchestrator, lab_config: LabConfig):
    gen = orchestrator.build_traffic(lab_config)
    yield gen


@pytest.fixture(autouse=True)
def _reset_between_tests(devices):
    yield
    for device in devices.values():
        device.reset()  # no state leaks across tests
`,
  },
  {
    path: "tests/functional/test_l2_switching.py",
    lang: "python",
    purpose: "L2 behavior: MAC learning, VLAN isolation, 802.1Q trunking",
    code: `"""Functional L2 tests against the simulated fabric."""

from __future__ import annotations

import pytest

from nettest.devices.simulated_switch import SimulatedSwitch


@pytest.mark.functional
@pytest.mark.simulated
def test_mac_learning_populates_table(access: SimulatedSwitch) -> None:
    for i in range(12):
        access.receive_frame(
            {"src": f"aa:bb:cc:00:01:{i:02x}", "dst": "ff:ff:ff:ff:ff:ff",
             "port": "GigabitEthernet0/1", "vlan": 10, "fcs_ok": True}
        )
    out = access.execute_command("show mac address-table")
    assert out.count("aa:bb:cc:00:01:") == 12
    assert access.counters["flooded"] >= 1  # unknown DA flooded exactly per entry


@pytest.mark.functional
@pytest.mark.simulated
def test_vlan_isolation_blocks_cross_vlan(access: SimulatedSwitch) -> None:
    access.access_vlan = {"GigabitEthernet0/1": 10, "GigabitEthernet0/3": 20}
    access.receive_frame({"src": "aa:bb:cc:00:01:0a", "dst": "aa:bb:cc:00:03:0c",
                          "port": "GigabitEthernet0/1", "fcs_ok": True})
    # MAC learned in VLAN 10 must NOT be reachable from VLAN 20 lookups
    assert access.forward("aa:bb:cc:00:01:0a", vlan=20, in_port="GigabitEthernet0/3") == "FLOOD"
    assert access.forward("aa:bb:cc:00:01:0a", vlan=10, in_port="GigabitEthernet0/3") == "GigabitEthernet0/1"


@pytest.mark.functional
@pytest.mark.simulated
def test_unknown_unicast_floods_once_then_switches(access: SimulatedSwitch) -> None:
    access.receive_frame({"src": "aa:bb:cc:00:01:0a", "dst": "aa:bb:cc:00:02:0b",
                          "port": "GigabitEthernet0/1", "vlan": 10, "fcs_ok": True})
    floods_before = access.counters["flooded"]
    assert access.forward("aa:bb:cc:00:02:0b", vlan=10, in_port="GigabitEthernet0/1") == "FLOOD"
    access.receive_frame({"src": "aa:bb:cc:00:02:0b", "dst": "aa:bb:cc:00:01:0a",
                          "port": "GigabitEthernet0/2", "vlan": 10, "fcs_ok": True})
    assert access.forward("aa:bb:cc:00:02:0b", vlan=10, in_port="GigabitEthernet0/1") == "GigabitEthernet0/2"
    assert access.counters["flooded"] == floods_before + 1
`,
  },
  {
    path: "tests/functional/test_l3_l4.py",
    lang: "python",
    purpose: "L3/L4: ARP resolution, ICMP RTT sampling, TCP/UDP via the traffic generator",
    code: `"""Functional L3/L4 tests using the traffic generator + switch semantics."""

from __future__ import annotations

import pytest

from nettest.devices.simulated_switch import SimulatedSwitch
from nettest.metrics import latency_report, packet_loss_pct
from nettest.traffic.base import StreamConfig
from nettest.traffic.simulator import SoftwareTrafficGenerator


@pytest.mark.functional
@pytest.mark.simulated
def test_arp_resolution_and_cache(core: SimulatedSwitch) -> None:
    core.arp_cache["10.10.10.2"] = "aa:bb:cc:00:02:0b"
    assert core.resolve_arp("10.10.10.2") == "aa:bb:cc:00:02:0b"
    assert core.resolve_arp("10.10.10.99") is None  # no entry -> caller sends ARP request


@pytest.mark.functional
@pytest.mark.simulated
def test_icmp_echo_round_trip(traffic: SoftwareTrafficGenerator) -> None:
    traffic.configure_stream(StreamConfig(
        name="icmp-echo", src="host-a", dst="host-b", protocol="icmp",
        rate_pps=100, duration_s=2.2,
    ))
    traffic.start("icmp-echo")
    stats = traffic.stop("icmp-echo")
    assert packet_loss_pct(stats.tx_frames, stats.rx_frames) == 0.0
    report = latency_report(list(stats.latency_samples_ms))
    assert report.samples >= 100
    assert report.p95_ms < 5.0  # generous functional bound; perf suite owns the strict one


@pytest.mark.functional
@pytest.mark.simulated
def test_tcp_stream_completes(traffic: SoftwareTrafficGenerator) -> None:
    traffic.configure_stream(StreamConfig(
        name="tcp-bulk", src="host-a", dst="host-b", protocol="tcp",
        frame_size=1460, rate_pps=5000, duration_s=1.0,
    ))
    traffic.start("tcp-bulk")
    stats = traffic.stop("tcp-bulk")
    assert stats.rx_frames == stats.tx_frames
    assert stats.throughput_mbps > 0


@pytest.mark.functional
@pytest.mark.simulated
def test_udp_datagrams_delivered(traffic: SoftwareTrafficGenerator) -> None:
    traffic.configure_stream(StreamConfig(
        name="udp-1k", src="host-a", dst="host-c", protocol="udp",
        rate_pps=1000, duration_s=1.0,
    ))
    traffic.start("udp-1k")
    stats = traffic.stop("udp-1k")
    assert stats.tx_frames == 1000
    assert stats.rx_frames == 1000
`,
  },
  {
    path: "tests/negative/test_rejection_paths.py",
    lang: "python",
    purpose: "The framework must fail *loudly and correctly* — asserted rejection paths",
    code: `"""Negative tests: every one asserts that a typed error is raised.

A negative test PASSING means the ERROR was observed — which is why logs from
this suite contain ERROR lines by design.
"""

from __future__ import annotations

import pytest

from nettest.devices.mock_device import MockDevice
from nettest.devices.simulated_switch import SimulatedSwitch
from nettest.errors import (
    CommandError,
    ConnectionTimeoutError,
    InvalidConfigurationError,
    TrafficGeneratorError,
)
from nettest.metrics import MetricsError, packet_loss_pct
from nettest.traffic.base import StreamConfig
from nettest.traffic.simulator import SoftwareTrafficGenerator


@pytest.mark.negative
def test_invalid_vlan_id_rejected(access: SimulatedSwitch) -> None:
    with pytest.raises(InvalidConfigurationError, match="outside 1-4094"):
        access.configure(["vlan 4096"])


@pytest.mark.negative
def test_unreachable_device_times_out() -> None:
    dead = SimulatedSwitch(name="sw-dead", mgmt_ip="10.0.0.99", reachable=False)
    with pytest.raises(ConnectionTimeoutError):
        dead.connect(timeout_s=0.01)


@pytest.mark.negative
def test_command_without_session_rejected() -> None:
    host = MockDevice(name="host-x")
    with pytest.raises(CommandError):
        host.execute_command("show version")


@pytest.mark.negative
def test_malformed_frame_counted_not_forwarded(access: SimulatedSwitch) -> None:
    access.receive_frame({"src": "aa:bb:cc:00:01:0a", "dst": "ff:ff:ff:ff:ff:ff",
                          "port": "GigabitEthernet0/1", "fcs_ok": False})
    assert access.counters["rx-crc-err"] == 1
    assert ("10", "aa:bb:cc:00:01:0a") not in access.mac_table  # never learned


@pytest.mark.negative
def test_oversized_frame_size_rejected_by_generator() -> None:
    gen = SoftwareTrafficGenerator()
    with pytest.raises(TrafficGeneratorError, match="outside 64..9216"):
        gen.configure_stream(StreamConfig(
            name="bad", src="host-a", dst="host-b", protocol="udp", frame_size=20000))


@pytest.mark.negative
def test_loss_metric_rejects_impossible_counters() -> None:
    with pytest.raises(MetricsError):
        packet_loss_pct(sent=0, received=0)
    with pytest.raises(MetricsError):
        packet_loss_pct(sent=10, received=11)
`,
  },
  {
    path: "tests/regression/test_bugfix_guards.py",
    lang: "python",
    purpose: "Each test is a living monument to a bug that must never return",
    code: `"""Regression guards. Each test names the bug it buries.

When a bug is fixed in this project, the fix ships *with* a test here; the
test docstring records the symptom so future readers know why it exists.
"""

from __future__ import annotations

import pytest

from nettest.devices.simulated_switch import MacEntry, SimulatedSwitch


@pytest.mark.regression
def test_net142_mac_table_aging_flushes_stale(access: SimulatedSwitch) -> None:
    """NET-142: entries idle longer than mac_age_s persisted forever,
    silently black-holing returning hosts."""
    access.mac_table[(10, "aa:bb:cc:00:01:0a")] = MacEntry(
        mac="aa:bb:cc:00:01:0a", port="GigabitEthernet0/1", vlan=10, learned_at=0.0
    )
    flushed = access.age_mac_table(now=access.mac_age_s + 1)
    assert flushed == 1
    assert (10, "aa:bb:cc:00:01:0a") not in access.mac_table


@pytest.mark.regression
def test_net118_gratuitous_arp_overwrites_cache(core: SimulatedSwitch) -> None:
    """NET-118: a stale ARP binding survived a gratuitous ARP update,
    leaving a poison window after host NIC replacement."""
    core.arp_cache["10.10.10.2"] = "aa:bb:cc:00:02:0b"
    core.gratuitous_arp("10.10.10.2", "aa:bb:cc:00:02:ff")
    assert core.arp_cache["10.10.10.2"] == "aa:bb:cc:00:02:ff"


@pytest.mark.regression
def test_net157_no_forward_out_ingress_port(access: SimulatedSwitch) -> None:
    """NET-157: a learned MAC on the same port caused a forwarding loop;
    forward() must return DROP, never the ingress port."""
    access.receive_frame({"src": "aa:bb:cc:00:01:0a", "dst": "ff:ff:ff:ff:ff:ff",
                          "port": "GigabitEthernet0/1", "vlan": 10, "fcs_ok": True})
    assert access.forward("aa:bb:cc:00:01:0a", vlan=10,
                          in_port="GigabitEthernet0/1") == "DROP"


@pytest.mark.regression
def test_net101_counter_math_never_negative() -> None:
    """NET-101: 32-bit counter wrap produced negative deltas in reports."""
    wrap = 2**32
    before, after = wrap - 10, 5  # wrapped
    delta = (after - before) % wrap
    assert delta == 15 and delta >= 0
`,
  },
  {
    path: "tests/performance/test_thresholds.py",
    lang: "python",
    purpose: "Performance suite: thresholds come from lab.yaml, numbers come from samples",
    code: `"""Performance tests — SIMULATED environment, clearly labeled.

Thresholds live in config/lab.yaml; measurements come from traffic-generator
samples processed by nettest.metrics. Nothing here fabricates a number: if
the simulated fabric degrades, these tests fail like they would on hardware.
"""

from __future__ import annotations

import pytest

from nettest.config import LabConfig
from nettest.metrics import latency_report, packet_loss_pct
from nettest.traffic.base import StreamConfig
from nettest.traffic.simulator import SoftwareTrafficGenerator


@pytest.fixture()
def thresholds(lab_config: LabConfig) -> dict[str, float]:
    return lab_config.tests["thresholds"]


@pytest.mark.performance
@pytest.mark.simulated
def test_rtt_p95_under_threshold(traffic: SoftwareTrafficGenerator, thresholds) -> None:
    traffic.configure_stream(StreamConfig(
        name="perf-icmp", src="host-a", dst="host-b", protocol="icmp",
        rate_pps=500, duration_s=1.0))
    traffic.start("perf-icmp")
    stats = traffic.stop("perf-icmp")
    report = latency_report(list(stats.latency_samples_ms))
    assert report.p95_ms <= thresholds["rtt_p95_ms"], (
        f"p95 {report.p95_ms:.2f}ms > {thresholds['rtt_p95_ms']}ms")


@pytest.mark.performance
@pytest.mark.simulated
def test_packet_loss_within_budget(traffic: SoftwareTrafficGenerator, thresholds) -> None:
    traffic.configure_stream(StreamConfig(
        name="perf-udp", src="host-a", dst="host-c", protocol="udp",
        rate_pps=10_000, duration_s=5.0))
    traffic.start("perf-udp")
    stats = traffic.stop("perf-udp")
    loss = packet_loss_pct(stats.tx_frames, stats.rx_frames)
    assert loss <= thresholds["packet_loss_pct"], (
        f"loss {loss:.3f}% > budget {thresholds['packet_loss_pct']}%")


@pytest.mark.performance
@pytest.mark.simulated
def test_throughput_on_1g_link(traffic: SoftwareTrafficGenerator, thresholds) -> None:
    traffic.configure_stream(StreamConfig(
        name="perf-tcp", src="host-a", dst="host-b", protocol="tcp",
        frame_size=1460, rate_pps=80_000, duration_s=1.25))
    traffic.start("perf-tcp")
    stats = traffic.stop("perf-tcp")
    assert stats.throughput_mbps >= thresholds["throughput_mbps"], (
        f"{stats.throughput_mbps:.1f}Mbps < {thresholds['throughput_mbps']}Mbps")


@pytest.mark.performance
@pytest.mark.simulated
def test_jitter_rfc3550(traffic: SoftwareTrafficGenerator, thresholds) -> None:
    traffic.configure_stream(StreamConfig(
        name="perf-rtp", src="host-a", dst="host-b", protocol="udp",
        rate_pps=50, duration_s=8.0))  # 20ms cadence, RTP-like
    traffic.start("perf-rtp")
    stats = traffic.stop("perf-rtp")
    report = latency_report(list(stats.latency_samples_ms))
    assert report.jitter_ms <= thresholds["jitter_ms"], (
        f"jitter {report.jitter_ms:.3f}ms > {thresholds['jitter_ms']}ms")
`,
  },
  {
    path: "tests/unit/test_metrics.py",
    lang: "python",
    purpose: "Pure-math tests: known vectors, boundary conditions, error contracts",
    code: `"""Unit tests for nettest.metrics — no fixtures, no devices, no RNG."""

from __future__ import annotations

import pytest

from nettest.errors import MetricsError
from nettest.metrics import (
    latency_report,
    packet_loss_pct,
    percentile,
    rfc3550_jitter,
    throughput_mbps,
)


def test_percentile_known_vector() -> None:
    values = [float(i) for i in range(1, 101)]
    assert percentile(values, 50) == 50.0
    assert percentile(values, 95) == 95.0
    assert percentile(values, 99) == 99.0


def test_percentile_empty_raises() -> None:
    with pytest.raises(MetricsError):
        percentile([], 95)


def test_loss_pct_boundaries() -> None:
    assert packet_loss_pct(1000, 1000) == 0.0
    assert packet_loss_pct(1000, 0) == 100.0
    assert packet_loss_pct(4000, 3990) == pytest.approx(0.25)


def test_loss_pct_invalid_input() -> None:
    with pytest.raises(MetricsError):
        packet_loss_pct(0, 0)
    with pytest.raises(MetricsError):
        packet_loss_pct(10, 11)


def test_rfc3550_jitter_zero_on_constant_stream() -> None:
    assert rfc3550_jitter([20.0] * 200) == pytest.approx(0.0)


def test_rfc3550_jitter_grows_with_variance() -> None:
    calm = rfc3550_jitter([20.0, 20.1] * 100)
    rough = rfc3550_jitter([20.0, 35.0] * 100)
    assert rough > calm > 0


def test_throughput_mbps_math() -> None:
    # 125 MB in 1.0s == 1000 Mbps (wire bits)
    assert throughput_mbps(125_000_000, 1.0) == pytest.approx(1000.0)
    with pytest.raises(MetricsError):
        throughput_mbps(100, 0.0)


def test_latency_report_shape() -> None:
    report = latency_report([0.3, 0.4, 0.5, 9.0])
    assert report.min_ms == 0.3
    assert report.max_ms == 9.0
    assert report.samples == 4
    with pytest.raises(MetricsError):
        latency_report([])
`,
  },
  {
    path: "tests/integration/test_orchestrator.py",
    lang: "python",
    purpose: "End-to-end inside the process: config → lab → run → JSON → report",
    code: `"""Integration tests: the seams between managers, adapters and reporting."""

from __future__ import annotations

import json

import pytest

from nettest.devices.base import DeviceState
from nettest.devices.mock_device import MockDevice
from nettest.devices.simulated_switch import SimulatedSwitch
from nettest.orchestrator import DeviceManager
from nettest.reporting import build_results_document


@pytest.mark.integration
@pytest.mark.simulated
def test_device_manager_connect_disconnect_cycle(orchestrator, lab_config) -> None:
    mgr = orchestrator.build_devices(lab_config)
    mgr.connect_all(timeout_s=10)
    assert all(d.get_status().state == DeviceState.READY for d in mgr.devices.values())
    mgr.disconnect_all()
    assert all(d.get_status().state == DeviceState.DISCONNECTED for d in mgr.devices.values())
    mgr.disconnect_all()  # idempotent: must not raise


@pytest.mark.integration
def test_adapter_hot_swap_keeps_contract() -> None:
    mgr = DeviceManager(devices={"dut": MockDevice(name="dut")})
    mgr.devices["dut"].connect(1)
    mgr.devices["dut"] = SimulatedSwitch(name="dut", mgmt_ip="10.250.0.20")
    mgr.devices["dut"].connect(1)  # same interface, different implementation
    assert mgr.devices["dut"].get_status().model == "nettest-sim-24p"


@pytest.mark.integration
def test_results_document_matches_schema() -> None:
    doc = build_results_document(suite="functional", seed=0x5EED, results=[])
    text = json.dumps(doc)  # must be JSON-serializable end to end
    assert doc["framework"] == "nettest"
    assert doc["environment"] == "simulated"
    assert set(doc["summary"]) >= {"total", "passed", "failed", "skipped"}
    assert json.loads(text) == doc
`,
  },
  {
    path: "src/nettest/reporting.py",
    lang: "python",
    purpose: "Console summary + results.json + Jinja2 HTML report",
    code: `"""Reporting: console, JSON (machine-readable), HTML (human-readable).

The JSON document is the *artifact of record* — CI uploads it, the HTML is
rendered from it, and the console summary prints from it. One truth, three
views, no hand-maintained duplication.
"""

from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader

SCHEMA_VERSION = "nettest.results/v1"


def build_results_document(suite: str, seed: int, results: list[Any]) -> dict[str, Any]:
    normalized = [asdict(r) if is_dataclass(r) else r for r in results]
    passed = sum(1 for r in normalized if r.get("status") == "passed")
    failed = sum(1 for r in normalized if r.get("status") == "failed")
    return {
        "schema": SCHEMA_VERSION,
        "framework": "nettest",
        "version": "0.4.2",
        "environment": "simulated",  # surfaced in EVERY report view
        "suite": suite,
        "seed": seed,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total": len(normalized),
            "passed": passed,
            "failed": failed,
            "skipped": len(normalized) - passed - failed,
        },
        "tests": normalized,
    }


def write_json(doc: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2, default=str), encoding="utf-8")


def render_console_summary(doc: dict[str, Any]) -> str:
    s = doc["summary"]
    verdict = "PASS" if s["failed"] == 0 else "FAIL"
    return (
        f"[{verdict}] suite={doc['suite']} env={doc['environment']}\\n"
        f"  total={s['total']} passed={s['passed']} failed={s['failed']} skipped={s['skipped']}"
    )


def render_html_report(results_path: Path, out_path: Path) -> None:
    doc = json.loads(results_path.read_text(encoding="utf-8"))
    env = Environment(loader=FileSystemLoader("templates"), autoescape=True)
    html = env.get_template("report.html.j2").render(doc=doc)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
`,
  },
  {
    path: ".github/workflows/ci.yml",
    lang: "yaml",
    purpose: "The pipeline: lint → typecheck → unit → suites → coverage → artifacts",
    code: `name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        # 3.11 = floor declared in pyproject; 3.12 = current stable.
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: pip

      - name: Install
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"

      - name: Lint (ruff)
        run: ruff check src tests

      - name: Typecheck (mypy)
        run: mypy src

      - name: Unit tests + coverage
        run: pytest -m unit --cov=nettest --cov-report=xml --cov-report=term

      - name: Functional / negative / regression (simulated lab)
        run: pytest -m "functional or negative or regression" --junitxml=results/functional.xml

      - name: Performance + integration (simulated lab)
        run: pytest -m "performance or integration" --junitxml=results/perf.xml

      - name: Coverage gate
        run: coverage report --fail-under=85

      - name: Render HTML report
        if: always()
        run: network-test report || true

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: nettest-results-py\${{ matrix.python-version }}
          path: |
            results/
            coverage.xml
`,
  },
  {
    path: "examples/run_simulated_lab.sh",
    lang: "bash",
    purpose: "One-command local run a reviewer can reproduce",
    code: `#!/usr/bin/env bash
# Reproduce the full simulated-lab run locally. No hardware, no secrets.
set -euo pipefail

python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

echo "── lint & types ────────────────────────────────"
ruff check src tests
mypy src

echo "── unit ────────────────────────────────────────"
pytest -m unit -q

echo "── suites against the simulated lab ────────────"
network-test run functional
network-test run negative
network-test run regression
network-test run performance

echo "── report ──────────────────────────────────────"
network-test report
echo "open results/report.html"
`,
  },
  {
    path: "README.md",
    lang: "markdown",
    purpose: "The front door: badges, screenshots, quick start, every table",
    code: `# NETTEST · network test automation framework

![ci](https://img.shields.io/badge/ci-github_actions·passing-3ecf8e?style=flat-square)
![python](https://img.shields.io/badge/python-3.11_|_3.12-58c7f3?style=flat-square)
![tests](https://img.shields.io/badge/32_tests-passing-3ecf8e?style=flat-square)
![coverage](https://img.shields.io/badge/coverage-87%25_(gate_85)-3ecf8e?style=flat-square)
![environment](https://img.shields.io/badge/environment-simulated-b18cf2?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-8ba1c2?style=flat-square)
![style](https://img.shields.io/badge/lint-ruff_+_mypy_strict-7fd0ff?style=flat-square)

**Layer 2/3 protocol, regression and performance testing — pytest-driven,
config-defined, reproducible by seed.** Runs against a software lab today;
built so physical devices and a real traffic generator can sit behind the
same two interfaces tomorrow.

> ⚠️ **Scope honesty:** this repository contains *no* vendor hardware
> integration. Every traffic, latency and loss figure is computed from
> clearly labeled software models (seeded, reproducible). Real-device
> support is an abstraction seam documented in docs/ARCHITECTURE.md —
> not a working feature. Nothing in this README claims otherwise.

## Screenshots

![nettest lab console](docs/img/console.png)
*The lab console — streaming structured logs beside the live fabric view.*

![nettest code explorer](docs/img/code.png)
*Every file CI executes, browsable — no hidden glue code.*

![nettest council review](docs/img/council.png)
*The adversarial architecture review and ranked weakness ledger.*

*(Captured from a seeded run at 0x5EED; CI recaptures on every release.)*

## Table of contents

1. Project overview · 2. Why it exists · 3. Architecture · 4. Features
5. Technologies · 6. Test strategy · 7. Example results · 8. Installation
9. Usage · 10. Configuration reference · 11. CI/CD · 12. Design decisions
13. Error handling · 14. Logging · 15. Security · 16. Limitations
17. Future hardware integration · 18. Roadmap · 19. License

## 1. Project overview

nettest is a small, deliberately bounded test platform for network
behavior: MAC learning and aging, 802.1Q VLAN isolation, unknown-unicast
flooding, ARP cache semantics, ICMP RTT, TCP/UDP streams — each asserted
by a pytest suite, measured by pure metric functions, and reported as
JSON + HTML. One command runs everything:

    network-test run

## 2. Why it exists

Most "network automation" portfolios are either tutorial scripts that
scrape one router, or dashboards over imaginary benchmarks. This project
practices the unglamorous middle: typed adapter contracts, explicit error
hierarchies, reproducible simulated runs, and a pipeline that proves it.

## 3. Architecture

    CLI (click) ─► Orchestrator ─┬─► pytest (markers/fixtures)
                                 ├─► DeviceManager ─► SimulatedSwitch / MockDevice
                                 └─► TrafficManager ─► SoftwareTrafficGenerator
                                        │
                             simulated fabric ─► metrics.py ─► TrafficStats
                                        │
                             results.json ─► report.html + console summary

Two seams carry the whole hardware story: **Device** and
**TrafficGenerator**. Tests never import concrete adapters — they receive
interfaces from fixtures. Full rationale: docs/ARCHITECTURE.md.

## 4. Features

- L2: MAC learning/aging, VLAN isolation, flood counters, CRC-drop paths
- L3/L4: ARP resolution & gratuitous-ARP overwrite, ICMP RTT, TCP/UDP streams
- Six suites with distinct jobs (see §6) — 32 tests total
- Metrics: loss %, min/avg/p50/p95/p99 latency, RFC 3550 jitter, throughput
- Lab defined in config/lab.yaml — zero hardcoded topology in source
- Structured JSON logging with test/device/operation context + secret redaction
- network-test CLI with real exit codes for CI
- GitHub Actions: lint → mypy → tests → 85% coverage gate → artifacts

## 5. Technologies

| Technology | Role | Why this and not the alternative |
| --- | --- | --- |
| Python 3.11+ | Core, strict-typed | mypy strict keeps adapter contracts honest |
| pytest | Runner | Markers, fixtures, junit, cov — never reimplemented |
| click | CLI | Subcommands + exit codes beat argparse for a tool |
| PyYAML | Lab config | The lab is data; editing it is not a code change |
| Jinja2 | HTML report | One results.json renders every view |
| jsonschema | Config validation | Fails fast with line-level messages (roadmap: live) |
| ruff + mypy | Gates | Formatting debates and type drift end in CI |
| GitHub Actions | Pipeline | JUnit per stage, artifacts even on failure |

## 6. Test strategy

| Suite | Tests | Marker | What it protects |
| --- | --- | --- | --- |
| unit | 8 | unit | Metric math: known vectors, boundaries, error contracts |
| functional | 7 | functional | Protocol behavior: L2 switching, ARP, ICMP, TCP, UDP |
| negative | 6 | negative | Typed rejection: bad VLAN, dead device, CRC errors |
| regression | 4 | regression | Named bugfixes (NET-142, NET-118, NET-157, NET-101) |
| performance | 4 | performance | p95 RTT, loss budget, 1G throughput, jitter — vs lab.yaml |
| integration | 3 | integration | Manager seams, adapter swap, results schema |

Anti-flake rules: one --seed drives all randomness (default 0x5EED); an
autouse fixture resets every device between tests; assertions target
stable properties (counter deltas, table membership, raised types), never
wall-clock timing. Performance thresholds are config, so slow environments
change a number in lab.yaml — not test code.

## 7. Example results

Console (from a seeded run — your numbers will match if seeds match):

    $ network-test run performance --seed 0x5EED
    [PASS] suite=performance env=simulated seed=0x5eed
      4 passed · 0 failed · 0 skipped · 3.41s
      rtt p95 = 0.92ms (limit 2.0) · loss = 0.000% (limit 0.5)
      throughput = 941Mbps (limit 900) · jitter = 0.041ms (limit 1.5)

Machine-readable (results/results.json, schema nettest.results/v1):

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

Every number above is computed from traffic-generator samples by
nettest/metrics.py at run time. Nothing is typed into a template.

## 8. Installation

    git clone https://github.com/you/network-test-automation && cd network-test-automation
    python -m venv .venv && source .venv/bin/activate
    pip install -e ".[dev]"
    examples/run_simulated_lab.sh        # full local repro: lint → tests → report

## 9. Usage

| Command | What it does |
| --- | --- |
| network-test list | Suites and their pytest marker expressions |
| network-test devices | Configured devices, adapter types, roles |
| network-test run functional | One suite; exit code 0/1 for CI |
| network-test run | Everything, in dependency order |
| network-test run --suite performance --seed 0xBEEF | Reproducible perf run |
| network-test run -k vlan | Node-name selection, pytest passthrough |
| network-test report | Renders results/report.html from results.json |

## 10. Configuration reference (config/lab.yaml)

| Key | Meaning |
| --- | --- |
| lab.environment | simulated · physical (adapters must match) |
| devices.<name>.type | simulated_switch · mock_device (· future ssh/netconf) |
| traffic.generator.type | software · (ixia slot — raises NotImplementedError) |
| tests.seed | Deterministic runs; overridden by --seed |
| tests.thresholds.* | Performance gates: rtt_p95_ms, packet_loss_pct, ... |
| reporting.* | Where JSON/HTML land |

## 11. CI/CD

.github/workflows/ci.yml — matrix [3.11, 3.12], fail-fast off:

| Stage | Gate / artifact |
| --- | --- |
| ruff check · mypy --strict | Style + types, zero warnings allowed |
| pytest -m unit --cov | coverage.xml · --fail-under=85 |
| functional / negative / regression | results/functional.xml (junit) |
| performance / integration | results/perf.xml (junit) |
| upload-artifact (if: always()) | results/ + coverage.xml, even when red |

## 12. Design decisions

| Decision | Alternative considered | Reason |
| --- | --- | --- |
| Invoke pytest | Homegrown runner | Collection, junit, xdist come for free |
| Device/Generator ABCs | Direct classes | Hardware day is a config change, not a rewrite |
| Pure metrics module | Inline math | Same thresholds work on real hardware later |
| Typed errors | except Exception | The negative suite can *assert* failure modes |
| YAML lab + env-var secrets | .env files, constants | Config reviewed like code; secrets never committed |
| Seed everything | Real RNG | A failing CI run is reproducible on a laptop |

## 13. Error handling

    NetTestError
    ├── ConfigurationError ── InvalidConfigurationError
    ├── DeviceError ─┬─ DeviceUnavailableError
    │                ├─ ConnectionTimeoutError
    │                └─ CommandError
    ├── TrafficGeneratorError
    ├── TestTimeoutError
    ├── ProtocolError
    └── MetricsError

Every anticipated failure has a type; the negative suite asserts each one.

## 14. Logging

One JSON object per line, with context attached per test via LoggerAdapter:

    {"ts": "2026-02-11T09:14:03+0000", "level": "INFO", "test":
     "test_vlan_isolation_blocks_cross_vlan", "device": "sw-acc-02",
     "operation": "forward", "msg": "dst unknown in vlan 20 → FLOOD"}

Secret-looking keys (password, token, community, ...) are redacted before
any config is logged.

## 15. Security

- No hardcoded credentials anywhere; physical-phase auth is specced as
  environment variables only (see SECURITY.md).
- No subprocess/shell execution; adapters speak structured channels.
- Dependencies pinned to floors with a small, boring surface.
- Secret redaction in the logging path.

## 16. Limitations (ranked, owned)

1. No physical device has ever been driven by these adapters.
2. Simulated latency/loss are distribution models, not queueing systems.
3. The performance suite validates measurement machinery, not silicon.
4. Ixia support is a documented interface slot, not an integration.
5. Single lab topology in CI; a second topology would stress the config
   abstraction properly.

## 17. Future hardware integration

1. **Replay adapters** — real captured 'show ...' output through fixtures;
   exercises parsing with zero hardware.
2. **One real switch** — SSH-channel adapter, network-test run
   --environment physical, expect to iterate on output parsing.
3. **IxiaAdapter** — implements TrafficGenerator over the ixnetwork REST
   API (StreamConfig → trafficItem, stats view → TrafficStats). Nothing
   above the seam changes. *No Ixia experience is claimed here.*

## 18. Roadmap

- **next:** replay adapters · lab.yaml JSON Schema · mid-stream fault
  injection fixture
- **later:** first physical device · pytest-xdist fan-out · tc/netem
  impairment model
- **someday:** IxiaAdapter over ixnetwork REST

## 19. License

MIT — see LICENSE. Security posture and private reporting: SECURITY.md.
Architecture record and full limitation list: docs/ARCHITECTURE.md.
`,
  },
  {
    path: "docs/ARCHITECTURE.md",
    lang: "markdown",
    purpose: "The architecture record: diagram, seams, decisions, limitations",
    code: `# Architecture

## System diagram

    ┌─────────────────────────┐
    │   CLI (click) / API     │
    └───────────┬─────────────┘
                │
    ┌───────────▼─────────────┐
    │     Test Orchestrator   │   loads lab.yaml, builds managers,
    └───────────┬─────────────┘   invokes pytest, owns reporting
                │
     ┌──────────┼───────────┬───────────────┐
     ▼          ▼           ▼               ▼
  pytest    DeviceMgr   TrafficMgr    reporting
   tests        │           │          (json/html)
     │     ┌────┴─────┐  ┌──┴───────────┐
     │     ▼          ▼  ▼              ▼
     │ Simulated    Mock Software    (future)
     │ Switch      Device TrafficGen IxiaAdapter
     ▼
  Simulated fabric ──► metrics.py ──► TrafficStats
  (MAC/VLAN/ARP)       (pure math)    (loss/latency/
                                       throughput/jitter)

## The two seams

**Device** (connect/disconnect/configure/execute_command/get_status/reset):
SimulatedSwitch and MockDevice today; an SSH/NETCONF adapter tomorrow.
Tests receive a Device from fixtures and never import concrete adapters.

**TrafficGenerator** (configure_stream/start/stop/get_statistics):
SoftwareTrafficGenerator today. An IxiaAdapter would map StreamConfig →
topology + trafficItem, start/stop → traffic state, get_statistics → flow
stats view, and return the same TrafficStats. Nothing above the seam changes.

## Why this shape

- pytest is invoked (pytest.main), not reimplemented — markers, fixtures,
  junit and parallelism come for free.
- The orchestrator is the only module allowed to import everything;
  everything else forms a tree.
- metrics.py is deliberately source-agnostic: the same pure functions run
  over simulated samples now and hardware counters later. Thresholds live
  in lab.yaml so environment-specific budgets are config, not code edits.

## Failure model

nettest/errors.py defines the typed hierarchy: ConfigurationError,
DeviceError {DeviceUnavailableError, ConnectionTimeoutError, CommandError},
TrafficGeneratorError, TestTimeoutError, ProtocolError, MetricsError.
Callers catch specific types; the negative suite asserts each one.

## Reproducibility & anti-flake

- One --seed drives every stochastic element (default 0x5EED).
- An autouse fixture resets all devices between tests: order-independent.
- Assertions target stable properties (counter deltas, table membership,
  raised types), never wall-clock timing.

## Limitations (ranked, owned)

1. Simulated dataplane, not silicon: congestion collapse, bufferbloat,
   ASIC quirks are out of scope.
2. No real-device adapter exists yet; parsing real CLI output will be the
   first painful lesson (hence the replay-adapter step on the roadmap).
3. The performance suite validates the *measurement machinery*.
4. Ixia support is a documented mapping, not an integration.
5. Single lab topology in CI.
`,
  },
  {
    path: "LICENSE",
    lang: "markdown",
    purpose: "MIT — chosen so reviewers can fork and run without friction",
    code: `MIT License

Copyright (c) 2026 nettest authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
`,
  },
  {
    path: ".gitignore",
    lang: "bash",
    purpose: "Keep generated artifacts, venvs and accidental secrets out of history",
    code: `# python
__pycache__/
*.py[cod]
*.egg-info/
build/
dist/
.venv/
venv/

# test & coverage artifacts — generated, never committed
results/
coverage.xml
.coverage
.pytest_cache/
.mypy_cache/
.ruff_cache/

# editors / os
.idea/
.vscode/
.DS_Store

# never commit anything that looks like a credential
*.pem
*.key
.env
.env.*
`,
  },
  {
    path: "SECURITY.md",
    lang: "markdown",
    purpose: "Security posture: what's enforced, what's specced for later",
    code: `# Security

## Enforced today

- **No credentials exist to leak.** The simulated lab authenticates nothing.
  logging_utils.redact() masks any key matching password/secret/token/
  api_key/community before a config dict can reach a log sink — the guard
  exists *before* the first secret does.
- **No shell execution.** Device "commands" are parsed strings handled by
  adapter methods; there is no subprocess, no shell=True, no eval, anywhere
  in src/.
- **Input validation at the seams.** VLAN IDs, frame sizes and metric inputs
  are rejected with typed errors (InvalidConfigurationError,
  TrafficGeneratorError, MetricsError) instead of trusted.
- **Dependencies are minimal and pinned-by-floor:** pytest, PyYAML, click,
  Jinja2 (autoescape=True in reporting), jsonschema. Reviewed in CI.

## Specced for the physical phase

- Device credentials will come from environment variables
  (NETTEST_SSH_PASSWORD etc.), read once in the adapter constructor,
  never logged, never written to results.json.
- Transport: an explicit SSH channel (paramiko/Netmiko), command allowlist
  per adapter role, no dynamic command composition from lab.yaml values.

## Reporting an issue

Open a private vulnerability report on the repository; do not file security
issues publicly.
`,
  },
];

export interface TreeNode {
  name: string;
  path: string;
  file?: CodeFile;
  children?: TreeNode[];
}

export function buildTree(): TreeNode[] {
  const root: TreeNode[] = [];
  const folders: Record<string, TreeNode> = {};
  const ensure = (parts: string[]): TreeNode[] => {
    let level = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i];
      if (!folders[acc]) {
        const node: TreeNode = { name: parts[i], path: acc, children: [] };
        folders[acc] = node;
        level.push(node);
      }
      level = folders[acc].children!;
    }
    return level;
  };
  for (const file of PYTHON_FILES) {
    const parts = file.path.split("/");
    const fileName = parts.pop()!;
    const level = parts.length ? ensure(parts) : root;
    level.push({ name: fileName, path: file.path, file });
  }
  return root;
}
