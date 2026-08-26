import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
    width: 18,
    height: 18,
    ...props,
  };
}

export function IconBolt(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M13 2 5 13.5h6L9.5 22 19 9.5h-6.5L13 2Z" />
    </svg>
  );
}

export function IconFlame(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-7 .7 1.6 1.5 2.4 3 3-.5-2.5-.5-5 0-7Z" />
    </svg>
  );
}

export function IconCheck(props: P) {
  return (
    <svg {...base(props)}>
      <path d="m4 13 5 5L20 6" />
    </svg>
  );
}

export function IconCheckSquare(props: P) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" />
      <path d="m7 12.5 3.5 3.5L17 8" />
    </svg>
  );
}

export function IconX(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function IconArrowRight(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M3 12h17M13 4l8 8-8 8" />
    </svg>
  );
}

export function IconArrowDownRight(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M6 5v9a4 4 0 0 0 4 4h8M13 13l5 5-5 5" />
    </svg>
  );
}

export function IconTimer(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M10 2h4M12 8v5l3.5 2" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

export function IconPause(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M8 5v14M16 5v14" strokeWidth={3} />
    </svg>
  );
}

export function IconPlay(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M7 4.5 19 12 7 19.5v-15Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrash(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconTarget(props: P) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconStar(props: P) {
  return (
    <svg {...base(props)}>
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" strokeWidth={2.4} />
    </svg>
  );
}

export function IconCaret(props: P) {
  return (
    <svg {...base(props)}>
      <path d="m5 3 14 9-14 9V3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
