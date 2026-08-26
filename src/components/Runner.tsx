import { useEffect, useMemo, useRef, useState } from "react";
import type { Aggregate, Level, LogLine, RunEvent, RunSummary, SuiteId, TestResult } from "../lib/sim";
import { SUITES, bootSequence, fmtMbps, fmtMs, runSuite, testsForSuite } from "../lib/sim";
import { Chip, Icon, Kicker, SectionTitle, useCountUp, usePrefersReducedMotion, useReveal } from "../lib/ui";
import { Topology } from "./Topology";

const LEVEL_CLS: Record<Level, string> = {
  SYS: "text-paper font-semibold",
  INFO: "text-fog",
  DEBUG: "text-fog-dim",
  CMD: "text-cy",
  WARN: "text-warn",
  ERROR: "text-fail",
  PASS: "text-pass",
  FAIL: "text-fail font-semibold",
};

function parseSeed(s: string): number {
  const t = s.trim();
  if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16);
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n > 0 ? n : 0x5eed;
}

function MetricTile({
  label, value, decimals, suffix, tone = "paper",
}: {
  label: string; value: number; decimals: number; suffix?: string; tone?: "paper" | "pass" | "warn" | "cy";
}) {
  const shown = useCountUp(value, decimals);
  const tones = { paper: "text-paper", pass: "text-pass", warn: "text-warn", cy: "text-cy" };
  return (
    <div className="group rounded-md border border-line-soft bg-ink-900/70 px-3.5 py-3 transition-colors duration-300 hover:border-cy/40">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog-dim">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold tabular-nums sm:text-[1.35rem] ${tones[tone]}`}>
        {shown}
        {suffix && <span className="ml-1 font-mono text-[10px] font-normal text-fog-dim">{suffix}</span>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: TestResult["status"] }) {
  return (
    <Chip tone={status === "passed" ? "pass" : status === "failed" ? "fail" : "fog"}>
      <Icon name={status === "passed" ? "check" : status === "failed" ? "x" : "stop"} size={10} />
      {status}
    </Chip>
  );
}

function computeLive(results: TestResult[]): Aggregate {
  let sent = 0, recv = 0, p95: number | null = null, jitter: number | null = null, tput: number | null = null;
  for (const r of results) {
    const m = r.metrics;
    if (!m) continue;
    sent += m.sent;
    recv += m.received;
    if (m.latency) { p95 = m.latency.p95; jitter = m.latency.jitterMs; }
    if (m.throughputMbps != null) tput = m.throughputMbps;
  }
  return {
    sent, received: recv,
    lossPct: sent ? ((sent - recv) / sent) * 100 : 0,
    p95Ms: p95, jitterMs: jitter, throughputMbps: tput,
    histogram: [], histMax: 1,
  };
}

export function Runner() {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useReveal<HTMLDivElement>();

  const [lines, setLines] = useState<LogLine[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [suite, setSuite] = useState<SuiteId | "all">("functional");
  const [fault, setFault] = useState(false);
  const [seedText, setSeedText] = useState("0x5EED");
  const [tab, setTab] = useState<"results" | "report" | "json">("results");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const abortRef = useRef(false);
  const didInit = useRef(false);
  const termRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);

  const appendLine = (line: LogLine) =>
    setLines((prev) => (prev.length > 420 ? [...prev.slice(prev.length - 340), line] : [...prev, line]));

  const handleEvent = (e: RunEvent) => {
    if (e.kind === "log") appendLine(e.line);
    else if (e.kind === "result") setResults((prev) => [...prev, e.result]);
    else if (e.kind === "progress") setProgress({ done: e.done, total: e.total });
    else if (e.kind === "done") setSummary(e.summary);
  };

  const start = async (s: SuiteId | "all", faulted: boolean, seedStr: string) => {
    setRunning(true);
    setSummary(null);
    setResults([]);
    setProgress({ done: 0, total: testsForSuite(s).length });
    abortRef.current = false;
    appendLine({ t: "", level: "CMD", src: "operator", msg: `network-test run ${s} --seed ${seedStr}${faulted ? " --fault-inject trunk" : ""}` });
    await runSuite({
      suite: s,
      seed: parseSeed(seedStr),
      fault: faulted,
      instant: reduced,
      emit: handleEvent,
      abort: () => abortRef.current,
    });
    setRunning(false);
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      await bootSequence(appendLine, reduced);
      await start("functional", false, "0x5EED");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    const el = termRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const agg = useMemo(() => (summary ? summary.aggregate : computeLive(results)), [summary, results]);
  const seed = parseSeed(seedText);

  const downloadJson = () => {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    } catch {
      /* clipboard unavailable in some sandboxes — non-fatal */
    }
  };

  return (
    <section id="console" className="relative mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8" ref={wrapRef}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="01">live simulated lab</Kicker>
          <SectionTitle
            sub={
              <>
                This console drives the same engine CI runs: a seeded simulator, typed device adapters and the
                metrics module computing percentiles, loss and jitter from raw samples. Every number below is
                calculated at runtime — <span className="text-sim">nothing is hardcoded</span>.
              </>
            }
          >
            Boot the lab.
            <br />
            Run the suite.
          </SectionTitle>
        </div>
        <div className="flex flex-col items-end gap-2 pb-1">
          <Chip tone="sim">environment · simulated</Chip>
          <Chip tone="fog">nettest v0.4.2</Chip>
          <span className="font-mono text-[11px] text-fog-dim">
            seed <span className="text-cy">0x{seed.toString(16).toUpperCase()}</span> · deterministic
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* ---------------- terminal column ---------------- */}
        <div className="reveal reveal-d1 lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-line bg-ink-900/90 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 border-b border-line bg-ink-850 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fail/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
              <span className="ml-3 truncate font-mono text-[11.5px] text-fog">
                nettest@demo-lab-01 — network-test run {suite}
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                <span className={`h-1.5 w-1.5 rounded-full ${running ? "led-pulse bg-warn text-warn" : summary ? "bg-pass text-pass" : "bg-fog-dim"}`} />
                <span className={running ? "text-warn" : summary ? "text-pass" : "text-fog-dim"}>
                  {running ? "running" : summary ? (summary.aborted ? "aborted" : summary.failed ? "fail" : "pass") : "idle"}
                </span>
              </span>
            </div>

            {/* controls */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line-soft bg-ink-900 px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {SUITES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => !running && setSuite(s.id)}
                    disabled={running}
                    title={s.blurb}
                    className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-all duration-200 ${
                      suite === s.id
                        ? "border-cy/60 bg-cy/15 text-cy shadow-[0_0_12px_rgba(88,199,243,0.25)]"
                        : "border-line bg-ink-850 text-fog hover:border-cy/40 hover:text-paper"
                    } ${running ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2.5">
                <label className="flex cursor-pointer items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-fog" title="Degrade the 802.1Q trunk (+3% loss, latency spikes) so threshold tests fail — the honest way to see a red run.">
                  <button
                    role="switch"
                    aria-checked={fault}
                    onClick={() => !running && setFault((f) => !f)}
                    disabled={running}
                    className={`relative h-[18px] w-8 rounded-full border transition-colors duration-200 ${fault ? "border-warn/70 bg-warn/30" : "border-line bg-ink-800"}`}
                  >
                    <span className={`absolute top-[2px] h-3 w-3 rounded-full transition-all duration-200 ${fault ? "left-[16px] bg-warn" : "left-[2px] bg-fog-dim"}`} />
                  </button>
                  fault inject
                </label>
                <div className="flex items-center gap-1 rounded border border-line bg-ink-850 px-2 py-1">
                  <span className="font-mono text-[10px] text-fog-dim">seed</span>
                  <input
                    value={seedText}
                    onChange={(e) => setSeedText(e.target.value)}
                    disabled={running}
                    spellCheck={false}
                    className="w-20 bg-transparent font-mono text-[11px] text-cy outline-none disabled:opacity-60"
                    aria-label="RNG seed"
                  />
                </div>
                {!running ? (
                  <button
                    onClick={() => start(suite, fault, seedText)}
                    className="flex items-center gap-1.5 rounded border border-pass/50 bg-pass/15 px-3.5 py-1.5 font-mono text-[11.5px] font-semibold text-pass transition-all duration-200 hover:bg-pass/25 hover:shadow-[0_0_18px_rgba(62,207,142,0.3)]"
                  >
                    <Icon name="play" size={12} /> run
                  </button>
                ) : (
                  <button
                    onClick={() => (abortRef.current = true)}
                    className="flex items-center gap-1.5 rounded border border-fail/50 bg-fail/15 px-3.5 py-1.5 font-mono text-[11.5px] font-semibold text-fail transition-all duration-200 hover:bg-fail/25"
                  >
                    <Icon name="stop" size={12} /> abort
                  </button>
                )}
              </div>
            </div>

            {/* log stream */}
            <div className="scanlines relative">
              <div
                ref={termRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
                }}
                className="terminal-scroll h-[380px] overflow-y-auto bg-ink-950/80 px-4 py-3 font-mono text-[11.8px] leading-[1.7]"
              >
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2 whitespace-pre-wrap break-all">
                    {l.t && <span className="shrink-0 text-fog-dim/50">{l.t}</span>}
                    <span className="w-14 shrink-0 text-right text-fog-dim">[{l.src}]</span>
                    <span className={LEVEL_CLS[l.level]}>
                      {l.level === "PASS" && "✓ "}
                      {l.level === "FAIL" && "✗ "}
                      {l.msg}
                    </span>
                  </div>
                ))}
                {running && (
                  <div className="flex gap-2">
                    <span className="text-fog-dim/50">…</span>
                    <span className="cursor-blink inline-block h-[13px] w-[7px] translate-y-[2px] bg-cy/80" />
                  </div>
                )}
                {lines.length === 0 && <div className="text-fog-dim">booting lab…</div>}
              </div>
            </div>

            {/* footer / progress */}
            <div className="border-t border-line bg-ink-850 px-4 py-2.5">
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${summary?.failed ? "bg-fail" : "bg-pass"}`}
                    style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-fog-dim">
                  {progress.done}/{progress.total || testsForSuite(suite).length} tests
                </span>
                <span className="text-pass">{results.filter((r) => r.status === "passed").length}✓</span>
                <span className="text-fail">{results.filter((r) => r.status === "failed").length}✗</span>
              </div>
            </div>
          </div>

          {/* ---------------- results / report / json ---------------- */}
          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-ink-900/80">
            <div className="flex items-center border-b border-line bg-ink-850">
              {(
                [
                  ["results", "results table"],
                  ["report", "report.html"],
                  ["json", "results.json"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`border-b-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${
                    tab === id ? "border-cy text-cy" : "border-transparent text-fog-dim hover:text-fog"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto flex gap-2 px-3">
                {tab === "json" && summary && (
                  <>
                    <button onClick={copyJson} className="flex items-center gap-1.5 rounded border border-line px-2.5 py-1 font-mono text-[10.5px] text-fog transition-colors hover:border-cy/50 hover:text-cy">
                      <Icon name="copy" size={11} /> copy
                    </button>
                    <button onClick={downloadJson} className="flex items-center gap-1.5 rounded border border-pass/40 px-2.5 py-1 font-mono text-[10.5px] text-pass transition-colors hover:bg-pass/10">
                      <Icon name="download" size={11} /> download
                    </button>
                  </>
                )}
              </div>
            </div>

            {tab === "results" && (
              <div className="terminal-scroll max-h-[340px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="px-5 py-10 text-center font-mono text-[12px] text-fog-dim">
                    no results yet — run a suite above
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-ink-850 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">
                      <tr>
                        <th className="px-4 py-2 font-medium">status</th>
                        <th className="px-2 py-2 font-medium">test</th>
                        <th className="px-2 py-2 font-medium">layer</th>
                        <th className="px-2 py-2 text-right font-medium">time</th>
                        <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">key metric</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[11.5px]">
                      {results.map((r) => (
                        <tr key={r.id} className="group border-t border-line-soft/60 transition-colors hover:bg-cy/[0.04]">
                          <td className="px-4 py-2"><StatusPill status={r.status} /></td>
                          <td className="px-2 py-2 text-paper/90">
                            {r.name}
                            {r.negative && <span className="ml-2 text-[9.5px] uppercase text-sim">negative</span>}
                            {r.bugRef && <span className="ml-2 text-[9.5px] uppercase text-warn">{r.bugRef}</span>}
                          </td>
                          <td className="px-2 py-2 text-fog">{r.layer}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-fog">{fmtMs(r.durationMs)}</td>
                          <td className="hidden px-4 py-2 text-right tabular-nums text-cy sm:table-cell">
                            {r.metrics?.latency
                              ? `p95 ${r.metrics.latency.p95.toFixed(2)}ms`
                              : r.metrics?.throughputMbps != null
                                ? fmtMbps(r.metrics.throughputMbps)
                                : r.metrics
                                  ? `loss ${r.metrics.lossPct.toFixed(3)}%`
                                  : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "report" && <ReportView summary={summary} />}
            {tab === "json" && (
              <pre className="code-scroll max-h-[340px] overflow-auto px-5 py-4 font-mono text-[11px] leading-[1.6] text-cy/90">
                {summary ? JSON.stringify(summary, null, 2) : "// run a suite to produce results.json"}
              </pre>
            )}
          </div>
        </div>

        {/* ---------------- topology + metrics column ---------------- */}
        <div className="lg:col-span-5">
          <div className="reveal reveal-d2 overflow-hidden rounded-lg border border-line bg-ink-900/80">
            <div className="flex items-center justify-between border-b border-line bg-ink-850 px-4 py-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog">demo-lab-01 · fabric view</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-fog-dim">
                <span className={`h-1.5 w-1.5 rounded-full ${running ? "led-pulse bg-cy text-cy" : "bg-fog-dim"}`} />
                {running ? "traffic flowing" : "links up · idle"}
              </span>
            </div>
            <div className="bg-blueprint bg-ink-950/60 p-3">
              <Topology running={running || (summary != null && !summary.aborted)} fault={fault} animate={!reduced} />
            </div>
          </div>

          <div className="reveal reveal-d3 mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            <MetricTile label="frames tx" value={agg.sent} decimals={0} tone="cy" />
            <MetricTile label="frames rx" value={agg.received} decimals={0} tone="pass" />
            <MetricTile label="packet loss" value={agg.lossPct} decimals={3} suffix="%" tone={agg.lossPct > 0.5 ? "warn" : "paper"} />
            <MetricTile label="rtt p95" value={agg.p95Ms ?? 0} decimals={2} suffix="ms" />
            <MetricTile label="jitter rfc3550" value={agg.jitterMs ?? 0} decimals={3} suffix="ms" />
            <MetricTile label="throughput" value={agg.throughputMbps ?? 0} decimals={1} suffix="Mbps" tone="cy" />
          </div>

          <div className="reveal reveal-d3 mt-4 rounded-md border border-sim/25 bg-sim/[0.06] px-4 py-3">
            <p className="font-mono text-[11px] leading-relaxed text-fog">
              <span className="text-sim">SIMULATED</span> — samples are drawn from a seeded Poisson/Bernoulli model;
              percentiles, jitter and loss are then computed by the same <span className="text-cy">metrics</span> module CI
              unit-tests. On hardware, only the sample source changes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportView({ summary }: { summary: RunSummary | null }) {
  if (!summary) {
    return <div className="px-5 py-10 text-center font-mono text-[12px] text-fog-dim">run a suite to render the report</div>;
  }
  const s = summary;
  return (
    <div className="code-scroll max-h-[340px] overflow-y-auto p-5">
      <div className="rounded-md border border-line bg-ink-950/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="font-display text-lg font-bold text-paper">nettest · run report</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-fog-dim">
              {s.framework} v{s.version} · suite <span className="text-cy">{s.suite}</span> · started {new Date(s.startedAt).toLocaleTimeString()}
            </div>
          </div>
          <div className="flex gap-2">
            <Chip tone="sim">env · simulated</Chip>
            <Chip tone={s.failed ? "fail" : "pass"}>{s.aborted ? "aborted" : s.failed ? "fail" : "pass"}</Chip>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            ["total", s.total, "text-paper"],
            ["passed", s.passed, "text-pass"],
            ["failed", s.failed, "text-fail"],
            ["skipped", s.skipped, "text-fog"],
            ["loss %", s.aggregate.lossPct.toFixed(3), "text-warn"],
            ["duration", fmtMs(s.durationMs), "text-cy"],
          ].map(([k, v, c]) => (
            <div key={k as string} className="rounded border border-line-soft bg-ink-900 px-2.5 py-2 text-center">
              <div className="font-mono text-[9.5px] uppercase tracking-wider text-fog-dim">{k}</div>
              <div className={`mt-0.5 font-display text-base font-bold tabular-nums ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {s.results.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5 rounded border border-line-soft/70 bg-ink-900/60 px-3 py-2">
              <span className={r.status === "passed" ? "mt-0.5 text-pass" : "mt-0.5 text-fail"}>
                <Icon name={r.status === "passed" ? "check" : "x"} size={12} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-mono text-[11.5px] text-paper/90">{r.name}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-fog">{r.detail}</div>
              </div>
              <span className="ml-auto shrink-0 font-mono text-[10.5px] tabular-nums text-fog-dim">{fmtMs(r.durationMs)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-line pt-3 font-mono text-[10px] text-fog-dim">
          rendered from results.json (schema nettest.results/v1) · seed 0x{s.seed.toString(16).toUpperCase()} ·
          generated by nettest.reporting — this document is what CI uploads as an artifact
        </div>
      </div>
    </div>
  );
}
