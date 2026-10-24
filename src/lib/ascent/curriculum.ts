import { validateGraph } from "./curriculum-validation";
import raw from "../../../content/knowledge/library.json";
import pathsRaw from "../../../content/knowledge/paths.json";
import { knowledgeSchema, studyPathSchema, type Knowledge } from "./schema";
import type { Progress } from "./engine";

export const knowledge = knowledgeSchema.array().parse(raw);
export const studyPaths = studyPathSchema.array().parse(pathsRaw);

export function evidence(progress: Progress, concept: Knowledge) {
  const attempt = [...progress.submissions]
    .reverse()
    .find((s) => s.problem === concept.problem);
  const code =
    concept.exercise_role === "application" &&
    !!attempt?.passed &&
    !attempt.hinted;
  return {
    recall:
      progress.completed.includes("knowledge:" + concept.id) &&
      progress.cards["knowledge:" + concept.id]?.repetitions !== 0,
    explanation:
      progress.completed.includes("question:" + concept.question.id) &&
      progress.cards["question:" + concept.question.id]?.repetitions !== 0,
    code,
    spaced: (progress.conceptRecallDates?.[concept.id]?.length ?? 0) >= 2,
  };
}

export function validateCurriculum(
  concepts = knowledge,
  paths = studyPaths,
  problemIds?: Set<string>,
) {
  validateGraph(concepts, paths, problemIds);
}

export function recommend(progress: Progress, limit = 3) {
  const path =
    studyPaths.find((path) => path.id === progress.studyPath) ?? studyPaths[0];
  const candidates = path.ids.map((id) => knowledge.find((k) => k.id === id)!);
  // Recommend prerequisites before their dependents, without locking the library.
  const ordered: Knowledge[] = [];
  const seen = new Set<string>();
  function visit(concept: Knowledge) {
    if (seen.has(concept.id)) return;
    seen.add(concept.id);
    for (const id of concept.prerequisites) {
      const prerequisite = knowledge.find((k) => k.id === id);
      if (prerequisite) visit(prerequisite);
    }
    ordered.push(concept);
  }
  candidates.forEach(visit);
  return ordered
    .filter((k) => {
      const e = evidence(progress, k);
      return (
        !e.recall ||
        !e.explanation ||
        (k.exercise_role === "application" && !e.code)
      );
    })
    .slice(0, limit)
    .map((concept) => {
      const e = evidence(progress, concept);
      return {
        concept,
        to: !e.recall
          ? "concept/" + concept.id
          : !e.explanation
            ? "question/" + concept.question.id
            : "problem/" + concept.problem,
        reason: !e.recall
          ? "Explain the mechanism"
          : !e.explanation
            ? "Defend it under follow-up questions"
            : "Pass the application checks without hints",
      };
    });
}
