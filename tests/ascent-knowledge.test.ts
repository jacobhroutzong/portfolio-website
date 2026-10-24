import { describe, it, expect } from "vitest";
import { knowledge, domains } from "../src/lib/ascent/knowledge";
import { problems } from "../src/lib/ascent/data";
describe("advanced curriculum contract", () => {
  it("covers six domains with substantive notes and questions", () => {
    expect(knowledge).toHaveLength(24);
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
});
