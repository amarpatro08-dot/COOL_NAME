import { useId } from "react";

interface TopologyProps {
  running: boolean;
  fault: boolean;
  animate: boolean; // false when prefers-reduced-motion
}

/**
 * The simulated lab fabric: traffic generator + 2 switches + 3 hosts.
 * While a suite runs, frame "packets" travel the paths (SMIL animateMotion);
 * the trunk link degrades visually when fault injection is armed.
 */
export function Topology({ running, fault, animate }: TopologyProps) {
  const uid = useId().replace(/[:]/g, "");
  const trunkColor = fault ? "var(--color-warn)" : "var(--color-cy)";
  const linkBase = "rgba(88,199,243,0.35)";

  const Node = ({
    x, y, w, label, sub, kind, ledOn,
  }: {
    x: number; y: number; w: number; label: string; sub: string; kind: string; ledOn: boolean;
  }) => (
    <g transform={`translate(${x},${y})`}>
      <rect
        width={w}
        height={54}
        rx={6}
        fill="rgba(13,23,41,0.92)"
        stroke={running ? "rgba(88,199,243,0.55)" : "rgba(29,47,82,0.9)"}
        strokeWidth={1.2}
        className="transition-all duration-500"
      />
      <rect x={0} y={0} width={3.5} height={54} rx={1.5} fill={kind === "sw" ? "var(--color-cy)" : kind === "tg" ? "var(--color-sim)" : "var(--color-pass)"} opacity={0.85} />
      <circle cx={w - 14} cy={13} r={3.2} fill={ledOn ? "var(--color-pass)" : "#31456e"} className={ledOn && animate ? "led-pulse" : ""} style={ledOn ? { color: "var(--color-pass)" } : undefined} />
      <text x={14} y={24} fontFamily="JetBrains Mono, monospace" fontSize={12} fontWeight={700} fill="var(--color-paper)">
        {label}
      </text>
      <text x={14} y={40} fontFamily="JetBrains Mono, monospace" fontSize={9.5} fill="var(--color-fog)">
        {sub}
      </text>
    </g>
  );

  const showPackets = running && animate;

  return (
    <svg viewBox="0 0 600 430" className="h-auto w-full" role="img" aria-label="Simulated lab topology: traffic generator, two switches, three hosts">
      <defs>
        <path id={`${uid}-tg-core`} d="M105 88 C 105 150, 240 120, 288 162" fill="none" />
        <path id={`${uid}-srv-core`} d="M495 88 C 495 150, 360 120, 318 162" fill="none" />
        <path id={`${uid}-trunk`} d="M300 222 L 300 268" fill="none" />
        <path id={`${uid}-acc-a`} d="M262 318 C 200 340, 130 350, 96 366" fill="none" />
        <path id={`${uid}-acc-b`} d="M300 326 L 300 366" fill="none" />
        <path id={`${uid}-acc-c`} d="M338 318 C 400 340, 470 350, 504 366" fill="none" />
      </defs>

      {/* links */}
      <g strokeWidth={1.6} fill="none">
        <path d="M105 88 C 105 150, 240 120, 288 162" stroke={linkBase} />
        <path d="M495 88 C 495 150, 360 120, 318 162" stroke={linkBase} />
        <path d="M300 222 L 300 268" stroke={trunkColor} strokeWidth={fault ? 2.2 : 1.8} strokeDasharray={fault ? "5 5" : "none"} className={fault ? "flow-dash" : ""} />
        <path d="M262 318 C 200 340, 130 350, 96 366" stroke={linkBase} />
        <path d="M300 326 L 300 366" stroke={linkBase} />
        <path d="M338 318 C 400 340, 470 350, 504 366" stroke={linkBase} />
      </g>

      {/* link labels */}
      <g fontFamily="JetBrains Mono, monospace" fontSize={9.5} fill="var(--color-fog)">
        <text x={310} y={250}>
          {fault ? "trunk degraded +3% loss" : "802.1Q trunk · vlan 10,20"}
        </text>
        <text x={112} y={345} transform="rotate(14 112 345)">access · vlan 10</text>
        <text x={452} y={345} transform="rotate(-14 452 345)">access · vlan 20</text>
      </g>

      {/* packets */}
      {showPackets && (
        <g>
          {[
            { p: `${uid}-tg-core`, c: "var(--color-sim)", dur: "1.7s", begin: "0s" },
            { p: `${uid}-tg-core`, c: "var(--color-sim)", dur: "1.7s", begin: "0.85s" },
            { p: `${uid}-trunk`, c: fault ? "var(--color-warn)" : "var(--color-cy)", dur: "0.9s", begin: "0.2s" },
            { p: `${uid}-trunk`, c: fault ? "var(--color-warn)" : "var(--color-cy)", dur: "0.9s", begin: "0.65s" },
            { p: `${uid}-acc-a`, c: "var(--color-pass)", dur: "1.3s", begin: "0.4s" },
            { p: `${uid}-acc-b`, c: "var(--color-pass)", dur: "1.1s", begin: "0.1s" },
            { p: `${uid}-acc-c`, c: "var(--color-pass)", dur: "1.4s", begin: "0.7s" },
            { p: `${uid}-srv-core`, c: "var(--color-cy)", dur: "1.9s", begin: "0.5s" },
          ].map((pkt, i) => (
            <circle key={i} r={3.1} fill={pkt.c} opacity={0.95}>
              <animateMotion dur={pkt.dur} begin={pkt.begin} repeatCount="indefinite" rotate="0">
                <mpath href={`#${pkt.p}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      )}

      {/* nodes */}
      <Node x={40} y={34} w={130} label="tg-sim-01" sub="SoftwareTrafficGen" kind="tg" ledOn={running} />
      <Node x={430} y={34} w={130} label="host-srv" sub="MockDevice · iperf-sim" kind="host" ledOn={running} />
      <Node x={230} y={168} w={140} label="sw-core-01" sub="SimulatedSwitch · L3" kind="sw" ledOn={running} />
      <Node x={230} y={272} w={140} label="sw-acc-02" sub="SimulatedSwitch · L2" kind="sw" ledOn={running} />
      <Node x={30} y={366} w={122} label="host-a" sub="vlan 10 · .10.1" kind="host" ledOn={running} />
      <Node x={239} y={366} w={122} label="host-b" sub="vlan 10 · .10.2" kind="host" ledOn={running} />
      <Node x={448} y={366} w={122} label="host-c" sub="vlan 20 · .20.3" kind="host" ledOn={running} />

      {fault && (
        <g transform="translate(248,236)">
          <rect width={104} height={18} rx={4} fill="rgba(240,180,84,0.14)" stroke="rgba(240,180,84,0.5)" />
          <text x={52} y={12.5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={9.5} fill="var(--color-warn)">
            FAULT INJECTED
          </text>
        </g>
      )}
    </svg>
  );
}
