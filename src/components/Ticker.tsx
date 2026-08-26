import { TICKER_LINES } from "../lib/data";
import { IconStar } from "./Icons";

export default function Ticker({ reverse = false }: { reverse?: boolean }) {
  const items = [...TICKER_LINES, ...TICKER_LINES];
  return (
    <div className="relative z-10 overflow-hidden border-y-2 border-ink bg-ink py-3 text-paper">
      <div
        className={`marquee-track flex w-max items-center gap-8 pr-8 ${
          reverse ? "marquee-slow" : ""
        }`}
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {items.map((line, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-display text-xl tracking-wide sm:text-2xl">{line}</span>
            <IconStar
              width={16}
              height={16}
              className={i % 3 === 0 ? "text-verm" : i % 3 === 1 ? "text-sun" : "text-cobalt"}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
