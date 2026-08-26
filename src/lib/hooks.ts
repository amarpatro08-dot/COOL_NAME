import { useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function usePersistentState<T>(
  key: string,
  initial: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* corrupted storage — fall through to initial */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — keep running in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

const SCRAMBLE_CHARS = "#/\\<>[]{}=+*XKQR0147";

export function useScramble(text: string, speed = 26): string {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? text : ""));
  const frame = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    frame.current = 0;
    const total = Math.max(6, Math.round(text.length * 1.4));
    const id = window.setInterval(() => {
      frame.current += 1;
      const settled = Math.floor((frame.current / total) * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") {
          out += " ";
        } else if (i < settled) {
          out += ch;
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(out);
      if (frame.current >= total) {
        setDisplay(text);
        window.clearInterval(id);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, reduced]);

  return display;
}

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
