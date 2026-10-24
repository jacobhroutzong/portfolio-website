import { describe, expect, it } from "vitest";
import {
  evidence,
  knowledge,
  recommend,
  studyPaths,
  validateCurriculum,
} from "../src/lib/ascent/curriculum";
import { fresh, parseProgress } from "../src/lib/ascent/engine";
import { problems } from "../src/lib/ascent/data";

describe("curriculum and independent evidence", () => {
  it("validates prerequisite graphs and all published paths/exercises", () => {
    expect(() =>
      validateCurriculum(
        knowledge,
        studyPaths,
        new Set(problems.map((p) => p.id)),
      ),
    ).not.toThrow();
    expect(
      new Set(knowledge.map((k) => k.question.rubric.join("|"))).size,
    ).toBe(knowledge.length);
  });
  it("rejects unknown and cyclic prerequisites", () => {
    const unknown = structuredClone(knowledge);
    unknown[0].prerequisites = ["missing"];
    expect(() => validateCurriculum(unknown)).toThrow("Unknown prerequisite");
    unknown[0].prerequisites = [unknown[0].id];
    expect(() => validateCurriculum(unknown)).toThrow("Cyclic");
  });
  it("rejects a path that studies a dependency after its consumer", () => {
    const paths = structuredClone(studyPaths);
    paths[0].ids = ["rope", "attention-contract"];
    expect(() => validateCurriculum(knowledge, paths)).toThrow("order");
  });
  it("recommends an advanced entry instead of assuming missing Python", () => {
    expect(recommend(fresh())[0].concept.id).toBe("attention-contract");
    const progress = fresh();
    progress.studyPath = "evidence-systems";
    expect(recommend(progress)[0].concept.id).toBe("benchmark-validity");
  });
  it("requires explanation and application separately from self-rated recall", () => {
    const progress = fresh();
    const concept = knowledge[0];
    progress.completed = ["knowledge:" + concept.id];
    expect(recommend(progress)[0].to).toBe("question/" + concept.question.id);
    progress.completed.push("question:" + concept.question.id);
    expect(recommend(progress)[0].to).toBe("problem/" + concept.problem);
    expect(evidence(progress, concept).code).toBe(false);
    progress.submissions.push({
      problem: concept.problem,
      code: "code",
      at: "2026-10-24",
      passed: true,
      elapsed: 10,
      hinted: false,
    });
    expect(evidence(progress, concept).code).toBe(true);
    expect(recommend(progress)[0].concept.id).not.toBe(concept.id);
  });
  it("does not count a hinted pass or a prerequisite drill as application evidence", () => {
    const progress = fresh();
    const concept = knowledge.find((k) => k.id === "agent-permissions")!;
    progress.submissions.push({
      problem: concept.problem,
      code: "code",
      at: "2026-10-24",
      passed: true,
      elapsed: 10,
      hinted: false,
    });
    expect(evidence(progress, concept).code).toBe(false);
    const application = knowledge.find((k) => k.id === "tool-reliability")!;
    progress.submissions[0].hinted = true;
    expect(evidence(progress, application).code).toBe(false);
    progress.submissions[0].hinted = false;
    progress.submissions.push({ ...progress.submissions[0], passed: false });
    expect(evidence(progress, application).code).toBe(false);
  });
  it("keeps old progress compatible and does not invent spaced recall", () => {
    const progress = parseProgress(JSON.parse(JSON.stringify(fresh())));
    const concept = knowledge[0];
    expect(evidence(progress, concept).spaced).toBe(false);
    progress.conceptRecallDates = { [concept.id]: ["2026-10-24"] };
    expect(evidence(progress, concept).spaced).toBe(false);
    progress.conceptRecallDates[concept.id].push("2026-10-25");
    expect(evidence(progress, concept).spaced).toBe(true);
    expect(parseProgress(progress).conceptRecallDates).toEqual(
      progress.conceptRecallDates,
    );
    progress.conceptRecallDates[concept.id].push("2026-10-25");
    expect(() => parseProgress(progress)).toThrow("recall dates");
  });
  it("revisits a concept after a failed recall instead of trusting an old completion flag", () => {
    const progress = fresh();
    progress.completed.push("knowledge:attention-contract");
    progress.cards["knowledge:attention-contract"] = {
      repetitions: 0,
      interval: 1,
      ease: 2,
      due: "2026-10-25",
    };
    expect(recommend(progress)[0].to).toBe("concept/attention-contract");
  });
});
