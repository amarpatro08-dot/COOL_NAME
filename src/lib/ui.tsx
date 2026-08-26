import { ReactNode, useEffect, useRef, useState } from "react";

/* ---------- motion preferences ---------- */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ---------- scroll reveal ---------- */

export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold },
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    if (el.classList.contains("reveal")) io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* ---------- count-up number ---------- */

export function useCountUp(target: number, decimals = 0, durMs = 650): string {
  const reduced = usePrefersReducedMotion();
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (reduced) {
      setVal(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    prev.current = target;
    if (from === target) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / durMs);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(from + (target - from) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durMs, reduced]);
  return val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/* ---------- shared primitives ---------- */

export function Kicker({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] uppercase text-cy">
      <span className="inline-block h-px w-8 bg-cy/60" />
      <span className="text-fog-dim">{index}</span>
      <span>{children}</span>
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mt-4 max-w-3xl">
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.06] tracking-tight text-paper">
        {children}
      </h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-fog">{sub}</p>}
    </div>
  );
}

export function Chip({
  tone = "fog",
  children,
  className = "",
}: {
  tone?: "fog" | "pass" | "fail" | "warn" | "cy" | "sim";
  children: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    fog: "text-fog border-line bg-ink-800",
    pass: "text-pass border-pass/35 bg-pass/10",
    fail: "text-fail border-fail/35 bg-fail/10",
    warn: "text-warn border-warn/35 bg-warn/10",
    cy: "text-cy border-cy/35 bg-cy/10",
    sim: "text-sim border-sim/35 bg-sim/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function SeverityChip({ level }: { level: string }) {
  const key = level.toLowerCase();
  const tone = key === "critical" ? "fail" : key === "high" ? "warn" : key === "medium" ? "cy" : "pass";
  return <Chip tone={tone as "fail" | "warn" | "cy" | "pass"}>sev · {key}</Chip>;
}

/* ---------- inline icon set (stroke, 24 viewBox) ---------- */

const PATHS: Record<string, ReactNode> = {
  terminal: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M6.5 9l3.5 3-3.5 3M12.5 15.5H17" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
      <path d="M3 12.5l9 4.5 9-4.5M3 17l9 4.5 9-4.5" />
    </>
  ),
  code: (
    <>
      <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
      <path d="M13.5 4l-3 16" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v6L4.8 19a1.6 1.6 0 001.4 2.4h11.6a1.6 1.6 0 001.4-2.4L13.5 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 14a8 8 0 1116 0" />
      <path d="M12 14l4-5M2.5 14h3M18.5 14h3M12 2.5v3" />
      <circle cx="12" cy="14" r="1.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.8-3.2 8.1-7.5 9.5-4.3-1.4-7.5-4.7-7.5-9.5V6L12 3z" />
      <path d="M8.8 12l2.2 2.2 4.2-4.4" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="5.5" r="2.3" />
      <circle cx="6" cy="18.5" r="2.3" />
      <circle cx="18" cy="8" r="2.3" />
      <path d="M6 7.8v8.4M18 10.3c0 4-4.5 4-7.5 5.4" />
    </>
  ),
  play: <path d="M7 4.5l12 7.5-12 7.5v-15z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  download: (
    <>
      <path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" />
      <path d="M4 17v2.5a1.5 1.5 0 001.5 1.5h13a1.5 1.5 0 001.5-1.5V17" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="1.5" />
      <path d="M15.5 5.5v-1a1.5 1.5 0 00-1.5-1.5H5a1.5 1.5 0 00-1.5 1.5V14A1.5 1.5 0 005 15.5h1" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L19.5 6.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chev: <path d="M8.5 5.5l7 6.5-7 6.5" />,
  pulse: <path d="M2.5 12h4l2.5-7 4.5 14 2.5-7h5.5" />,
  warning: (
    <>
      <path d="M12 3.5L22 20H2L12 3.5z" />
      <path d="M12 10v4.5M12 17.4v.4" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  doc: (
    <>
      <path d="M6 2.5h8l4 4V21.5H6V2.5z" />
      <path d="M14 2.5v4h4M9 12h6M9 15.5h6" />
    </>
  ),
  arrow: <path d="M4 12h15M13.5 6l6 6-6 6" />,
};

export function Icon({ name, size = 18, className = "" }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.box}
    </svg>
  );
}
