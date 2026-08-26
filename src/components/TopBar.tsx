import { useClock } from "../lib/hooks";
import { IconBolt, IconFlame } from "./Icons";

export default function TopBar({ streak }: { streak: number }) {
  const now = useClock(1000);
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const isLeap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  const totalDays = isLeap ? 366 : 365;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center border-2 border-ink bg-ink text-paper transition-colors group-hover:bg-verm group-hover:border-verm">
            <IconBolt width={20} height={20} />
          </span>
          <span className="font-display text-2xl leading-none tracking-wide">
            DO<span className="text-verm">/</span>IT
          </span>
          <span className="mt-1 hidden font-mono text-[10px] tracking-[0.2em] text-ink-dim sm:inline">
            EXECUTION BOARD
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 border-2 border-ink bg-card px-3 py-1.5 font-mono text-xs font-semibold md:flex">
            <span className="text-verm">DAY</span>
            <span className="digits">{String(dayOfYear).padStart(3, "0")}</span>
            <span className="text-ink-dim">/ {totalDays}</span>
          </div>
          <div className="border-2 border-ink bg-ink px-3 py-1.5 font-mono text-xs font-semibold text-paper">
            <span className="digits">
              {hh}:{mm}
            </span>
            <span className="digits text-sun">:{ss}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-xs font-bold ${
              streak > 0
                ? "border-ink bg-verm text-paper"
                : "border-ink bg-card text-ink-dim"
            }`}
            title="Shipping streak — consecutive days with at least one task shipped"
          >
            <IconFlame width={14} height={14} />
            <span className="digits">{streak}</span>
            <span className="hidden sm:inline">STREAK</span>
          </div>
        </div>
      </div>
      <div className="hazard h-1.5 w-full" />
    </header>
  );
}
