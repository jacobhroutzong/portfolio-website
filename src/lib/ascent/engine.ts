import type { Exercise } from "./schema";
export type Card = {
  ease: number;
  interval: number;
  repetitions: number;
  due: string;
};
export type Skill = {
  level: number;
  successes: number;
  last: string;
  dates: string[];
};
export type Submission = {
  problem: string;
  code: string;
  at: string;
  passed: boolean;
  elapsed: number;
  hinted: boolean;
  timed?: boolean;
};
export type Progress = {
  version: 1;
  xp: number;
  goal: number;
  days: Record<string, number>;
  skills: Record<string, Skill>;
  cards: Record<string, Card>;
  completed: string[];
  bosses: number[];
  submissions: Submission[];
  stories: Record<string, string>;
  mistakes: Record<string, number>;
  placement: boolean;
  restDay: number;
  drafts: Record<string, string>;
};
export const fresh = (): Progress => ({
  version: 1,
  xp: 0,
  goal: 80,
  days: {},
  skills: {},
  cards: {},
  completed: [],
  bosses: [],
  submissions: [],
  stories: {},
  mistakes: {},
  placement: false,
  restDay: 0,
  drafts: {},
});
export function day(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function schedule(
  previous: Card | undefined,
  quality: number,
  now = new Date(),
): Card {
  const c = previous ?? {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    due: day(now),
  };
  const repetitions = quality < 3 ? 0 : c.repetitions + 1;
  const ease = Math.max(
    1.3,
    c.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  const interval =
    quality < 3
      ? 1
      : repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.round(c.interval * ease);
  const date = new Date(now);
  date.setDate(date.getDate() + interval);
  return { ease, interval, repetitions, due: day(date) };
}
export function mastery(
  previous: Skill | undefined,
  correct: boolean,
  now = new Date(),
): Skill {
  const p = previous ?? { level: 0, successes: 0, last: day(now), dates: [] };
  const dates = correct ? [...new Set([...p.dates, day(now)])] : p.dates;
  const successes = correct ? p.successes + 1 : Math.max(0, p.successes - 1);
  return {
    level: correct
      ? Math.min(5, Math.min(dates.length, Math.floor(successes / 2) + 1))
      : Math.max(0, p.level - 1),
    successes,
    last: day(now),
    dates,
  };
}
export function effectiveLevel(skill: Skill | undefined, now = new Date()) {
  if (!skill) return 0;
  const days =
    (now.getTime() - new Date(skill.last + "T12:00:00").getTime()) / 86400000;
  return Math.max(0, skill.level - Math.floor(Math.max(0, days - 14) / 30));
}
export function reward(p: Progress, amount: number) {
  p.xp += amount;
  p.days[day()] = (p.days[day()] ?? 0) + amount;
}
export function streak(p: Progress) {
  let count = 0;
  let freeze = 1;
  const date = new Date();
  if (!p.days[day(date)]) date.setDate(date.getDate() - 1);
  for (let i = 0; i < 3660; i++) {
    if (p.days[day(date)]) count++;
    else if (count > 0 && freeze > 0) {
      freeze--;
    } else break;
    if (date.getDay() === 1) freeze = 1;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
export function grade(e: Exercise, value: string | string[]) {
  if (e.type === "free") return false;
  if (e.type === "estimation" || e.type === "math") {
    const a = Number(e.answer),
      v = Number(value);
    return (
      String(value).trim() !== "" &&
      Number.isFinite(v) &&
      Math.abs(v - a) <= Math.max(1e-9, Math.abs(a) * (e.tolerance ?? 0))
    );
  }
  if (Array.isArray(e.answer)) {
    const actual = Array.isArray(value)
      ? value
      : String(value)
          .split(",")
          .map((s) => s.trim());
    return (
      JSON.stringify(e.type === "multi" ? [...actual].sort() : actual) ===
      JSON.stringify(e.type === "multi" ? [...e.answer].sort() : e.answer)
    );
  }
  return (
    String(value).trim().toLowerCase().replace(/\s/g, "") ===
    String(e.answer).trim().toLowerCase().replace(/\s/g, "")
  );
}
export function readiness(p: Progress, weights: number[]) {
  const levels = weights.map((_, i) => effectiveLevel(p.skills[String(i)]) / 5);
  const m =
    levels.reduce((s, n, i) => s + n * weights[i], 0) /
    weights.reduce((a, b) => a + b, 0);
  const attempts = p.submissions.slice(-20);
  const coverage =
    new Set(attempts.filter((s) => s.passed).map((s) => s.problem)).size / 15;
  const timed = attempts.filter(
    (s) => s.timed && s.elapsed <= 60 * 60000 && !s.hinted,
  );
  const performance = timed.length
    ? timed.filter((s) => s.passed).length / timed.length
    : 0;
  return Math.round(100 * (0.6 * m + 0.2 * coverage + 0.2 * performance));
}
export function parseProgress(input: unknown): Progress {
  if (!input || typeof input !== "object")
    throw new Error("Not a progress file");
  const p = input as Progress;
  if (
    p.version !== 1 ||
    !Number.isFinite(p.xp) ||
    p.xp < 0 ||
    !Number.isFinite(p.goal) ||
    p.goal < 10 ||
    p.goal > 1000 ||
    !Array.isArray(p.completed) ||
    !p.completed.every((x) => typeof x === "string") ||
    !Array.isArray(p.bosses) ||
    !p.bosses.every(Number.isInteger) ||
    !Array.isArray(p.submissions) ||
    !p.submissions.every(
      (s) =>
        typeof s.code === "string" &&
        typeof s.problem === "string" &&
        typeof s.passed === "boolean" &&
        Number.isFinite(s.elapsed),
    )
  )
    throw new Error("Invalid progress data");
  for (const key of [
    "days",
    "skills",
    "cards",
    "stories",
    "mistakes",
    "drafts",
  ] as const) {
    if (!p[key] || typeof p[key] !== "object" || Array.isArray(p[key]))
      throw new Error("Invalid " + key);
  }
  for (const s of Object.values(p.skills)) {
    if (
      !Number.isFinite(s.level) ||
      s.level < 0 ||
      s.level > 5 ||
      !Array.isArray(s.dates) ||
      typeof s.last !== "string"
    )
      throw new Error("Invalid mastery");
  }
  for (const c of Object.values(p.cards)) {
    if (
      typeof c.due !== "string" ||
      !Number.isFinite(c.ease) ||
      !Number.isFinite(c.interval) ||
      !Number.isFinite(c.repetitions)
    )
      throw new Error("Invalid review");
  }
  for (const v of Object.values(p.days)) {
    if (!Number.isFinite(v) || v < 0) throw new Error("Invalid activity");
  }
  for (const v of [...Object.values(p.stories), ...Object.values(p.drafts)])
    if (typeof v !== "string") throw new Error("Invalid text");
  return structuredClone(p);
}
