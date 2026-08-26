export type Urgency = "now" | "soon" | "later";
export type TaskStatus = "queued" | "now" | "done";

export interface Task {
  id: string;
  title: string;
  urgency: Urgency;
  status: TaskStatus;
  createdAt: number;
  doneAt?: number;
  focusSec?: number;
}

export interface DayStats {
  done: number;
  focus: number; // seconds
}

export interface Stats {
  days: Record<string, DayStats>;
  total: number; // all-time shipped
  created: number; // all-time work orders issued
}

export const URGENCY_META: Record<Urgency, { label: string; weight: number }> = {
  now: { label: "NOW", weight: 2 },
  soon: { label: "SOON", weight: 1 },
  later: { label: "LATER", weight: 0 },
};

export const PRESET_MIN = [5, 15, 25, 45];
export const DAILY_TARGET = 5;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function fmtMinutes(sec: number): string {
  const m = Math.round(sec / 60);
  return `${m} MIN`;
}

export function fmtTimeOfDay(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function computeStreak(days: Record<string, DayStats>): number {
  let streak = 0;
  const cursor = new Date();
  const todayHas = (days[dayKey(cursor)]?.done ?? 0) > 0;
  if (!todayHas) cursor.setDate(cursor.getDate() - 1);
  while ((days[dayKey(cursor)]?.done ?? 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

export function makeSeedTasks(): Task[] {
  const t = Date.now();
  return [
    {
      id: uid(),
      title: "Send the email you've been redrafting for three days",
      urgency: "now",
      status: "queued",
      createdAt: t - 1000 * 60 * 9,
    },
    {
      id: uid(),
      title: "Book the dentist — it takes four minutes",
      urgency: "soon",
      status: "queued",
      createdAt: t - 1000 * 60 * 4,
    },
    {
      id: uid(),
      title: "Write the first ugly paragraph of the proposal",
      urgency: "soon",
      status: "queued",
      createdAt: t - 1000 * 60 * 2,
    },
  ];
}

export function makeSeedStats(): Stats {
  const days: Record<string, DayStats> = {};
  const pattern = [3, 2, 4, 1, 0, 2, 3, 5, 2, 0, 1, 4, 3];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < pattern.length; i++) {
    const n = pattern[i];
    if (n > 0) days[dayKey(cursor)] = { done: n, focus: n * 21 * 60 };
    cursor.setDate(cursor.getDate() - 1);
  }
  const total = pattern.reduce((a, b) => a + b, 0);
  return { days, total, created: total + 9 };
}

export const TICKER_LINES = [
  "DONE BEATS PERFECT",
  "MOTIVATION FOLLOWS MOTION",
  "SHIP THE UGLY VERSION",
  "NO ZERO DAYS",
  "ACTION CURES OVERTHINKING",
  "FIVE MINUTES IN IS ALL IT TAKES",
  "YOUR FUTURE SELF IS WATCHING",
  "SMALL SHIPS SINK EXCUSES",
  "THE CLOCK IS A TOOL, NOT A THREAT",
  "START BEFORE YOU'RE READY",
];

export interface Excuse {
  excuse: string;
  comeback: string;
}

export const EXCUSES: Excuse[] = [
  {
    excuse: "I'm too tired",
    comeback:
      "You'll be more tired tomorrow, carrying this around like unpaid luggage. Ten minutes. Sit down. Start small.",
  },
  {
    excuse: "I don't feel motivated",
    comeback:
      "Motivation is a reward for starting, not a prerequisite. It shows up around minute three. Go meet it there.",
  },
  {
    excuse: "I need to research more",
    comeback:
      "You need roughly 10% more information, and you already have 90%. The last 10% only reveals itself in motion.",
  },
  {
    excuse: "It's too big",
    comeback:
      "So stop doing 'it'. Do the smallest real piece — the two-minute slice. Big things are just small things in a trench coat.",
  },
  {
    excuse: "I'll do it tomorrow",
    comeback:
      "Tomorrow-you is the exact same person with less time and the same dread. Place your bet on today-you.",
  },
  {
    excuse: "It has to be perfect",
    comeback:
      "Then it will be nothing. Perfect is a direction, not a starting line. Ship rough, fix it while it's moving.",
  },
  {
    excuse: "I work better under pressure",
    comeback:
      "Fine — manufacture pressure. One task, fifteen minutes, clock running. That's a deadline. Now you're in your element.",
  },
  {
    excuse: "I need the right setup first",
    comeback:
      "The right setup is a task-shaped hole that never gets filled. Ugly desk, bad chair, open document. Go.",
  },
];
