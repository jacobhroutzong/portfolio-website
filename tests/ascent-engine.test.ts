import { describe, it, expect } from "vitest";
import {
  fresh,
  day,
  mastery,
  schedule,
  effectiveLevel,
  grade,
  parseProgress,
  readiness,
  streak,
} from "../src/lib/ascent/engine";
import { lessons, problems } from "../src/lib/ascent/data";
describe("learning evidence", () => {
  it("requires separate days to earn mastery", () => {
    let skill = mastery(undefined, true, new Date(2026, 9, 24));
    for (let i = 0; i < 20; i++)
      skill = mastery(skill, true, new Date(2026, 9, 24));
    expect(skill.level).toBe(1);
    skill = mastery(skill, true, new Date(2026, 9, 25));
    expect(skill.level).toBe(2);
    expect(mastery(skill, false).level).toBe(1);
  });
  it("decays long-unrecalled mastery", () => {
    const skill = {
      level: 4,
      successes: 20,
      last: "2026-01-01",
      dates: ["2026-01-01"],
    };
    expect(effectiveLevel(skill, new Date(2026, 9, 24))).toBe(0);
  });
  it("schedules a lapse sooner than a repeated success", () => {
    const now = new Date(2026, 9, 24);
    const first = schedule(undefined, 4, now);
    const next = schedule(first, 4, now);
    expect(first.interval).toBe(1);
    expect(next.interval).toBe(6);
    expect(schedule(next, 1, now).interval).toBe(1);
  });
  it("round trips progress and rejects malformed imports", () => {
    const progress = fresh();
    progress.completed = ["one"];
    expect(parseProgress(JSON.parse(JSON.stringify(progress)))).toEqual(
      progress,
    );
    expect(() => parseProgress({ version: 1 })).toThrow();
    expect(() =>
      parseProgress({ ...progress, skills: { bad: { level: 99 } } }),
    ).toThrow();
  });
  it("starts readiness at zero and never promises an outcome", () =>
    expect(readiness(fresh(), Array(13).fill(1))).toBe(0));
  it("keeps historical independent coverage when the library exceeds the recent-attempt window", () => {
    const p = fresh();
    p.submissions = Array.from({ length: 29 }, (_, i) => ({
      problem: "problem-" + i,
      code: "code",
      at: "2026-10-24",
      passed: true,
      elapsed: 1,
      hinted: false,
    }));
    expect(readiness(p, Array(13).fill(1), 29)).toBe(20);
    p.submissions.forEach((s) => {
      s.hinted = true;
    });
    expect(readiness(p, Array(13).fill(1), 29)).toBe(0);
  });
  it("grades selection order independently but ordering exactly", () => {
    const base = { id: "x", prompt: "x", explanation: "x", answer: ["a", "b"] };
    expect(grade({ ...base, type: "multi" }, ["b", "a"])).toBe(true);
    expect(grade({ ...base, type: "ordering" }, ["b", "a"])).toBe(false);
  });
  it("does not accept empty numeric input as zero", () =>
    expect(
      grade(
        { id: "x", type: "math", prompt: "x", answer: 0, explanation: "x" },
        "",
      ),
    ).toBe(false));
  it("has the original exercise slice and domain applications without hidden payloads", () => {
    expect(
      lessons.reduce((n, l) => n + l.exercises.length, 0),
    ).toBeGreaterThanOrEqual(60);
    expect(problems.length).toBe(29);
    expect(
      problems.every(
        (problem) =>
          !Object.hasOwn(problem, "reference") &&
          !Object.hasOwn(problem, "hidden"),
      ),
    ).toBe(true);
  });
  it("has no streak before learning and increments from today", () => {
    const p = fresh();
    expect(streak(p)).toBe(0);
    p.days[day()] = 10;
    expect(streak(p)).toBe(1);
  });
});
