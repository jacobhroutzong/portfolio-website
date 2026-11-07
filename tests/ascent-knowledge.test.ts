import { describe, it, expect } from "vitest";
import { knowledge, domains } from "../src/lib/ascent/knowledge";
import { problems } from "../src/lib/ascent/data";
import { studyPaths, validateCurriculum } from "../src/lib/ascent/curriculum";
import { knowledgeSchema } from "../src/lib/ascent/schema";

const frontier = [
  ["moe-routing", "transformer-depth", "moe-budget"],
  ["mla-cache", "inference-systems", "mla-cache-budget"],
  ["distributed-sharding", "reliable-training", null],
  ["durable-agent-recovery", "evidence-systems", "recovery-plan"],
  ["budgeted-agent-evals", "evidence-systems", null],
  ["verifier-robustness", "reliable-training", null],
  ["quantized-serving", "inference-systems", "quantization-gate"],
  ["multimodal-grounding", "transformer-depth", null],
  ["training-data-lineage", "reliable-training", "lineage-overlap"],
  ["serving-goodput", "inference-systems", null],
  ["computer-use-boundaries", "evidence-systems", null],
  ["adaptive-test-compute", "inference-systems", null],
] as const;

describe("advanced curriculum contract", () => {
  it("covers six domains with substantive notes and questions", () => {
    expect(knowledge).toHaveLength(42);
    expect(domains).toHaveLength(6);
    for (const k of knowledge) {
      expect(k.example.length).toBeGreaterThan(50);
      expect(k.question.answer.length).toBeGreaterThan(100);
      expect(k.sources.every((s) => s.url.startsWith("https://"))).toBe(true);
    }
  });
  it("connects every reference to real concepts and executable problems", () => {
    for (const k of knowledge) {
      expect(problems.some((p) => p.id === k.problem)).toBe(true);
      for (const id of k.related)
        expect(knowledge.some((k) => k.id === id)).toBe(true);
    }
  });
  it.each(frontier)(
    "connects %s to a dated bibliography, prerequisites, and its study path",
    (id, path, application) => {
      const concept = knowledge.find((k) => k.id === id)!;
      expect(concept.question.id).toBe(`q-${id}`);
      expect(concept.prerequisites.length).toBeGreaterThan(0);
      expect(studyPaths.find((p) => p.id === path)?.ids).toContain(id);
      expect(concept.sources.every((s) => s.published && s.evidence_kind)).toBe(
        true,
      );
      expect(concept.exercise_role).toBe(
        application ? "application" : "prerequisite",
      );
      if (application) expect(concept.problem).toBe(application);
    },
  );
  it("rejects malformed, incomplete, and future source metadata while allowing older notes", () => {
    const entry = structuredClone(knowledge.find((k) => k.id === "mla-cache")!);
    expect(knowledgeSchema.safeParse(knowledge[0]).success).toBe(true);
    const original = { ...entry.sources[0] };
    entry.sources[0].published = "2026-02-31";
    expect(knowledgeSchema.safeParse(entry).success).toBe(false);
    entry.sources[0].published = "2026-11-08";
    const curriculum = knowledge.map((k) => (k.id === entry.id ? entry : k));
    expect(() => validateCurriculum(curriculum)).toThrow(
      "Source date after verification",
    );
    entry.sources[0] = { ...original, evidence_kind: undefined };
    expect(() => validateCurriculum(curriculum)).toThrow(
      "Incomplete source metadata",
    );
  });
});
