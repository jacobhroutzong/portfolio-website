import type { Knowledge, StudyPath } from "./schema";

export function validateGraph(
  concepts: Knowledge[],
  paths: StudyPath[],
  problemIds?: Set<string>,
) {
  const byId = new Map(concepts.map((k) => [k.id, k]));
  if (
    byId.size !== concepts.length ||
    new Set(concepts.map((k) => k.question.id)).size !== concepts.length
  )
    throw new Error("Duplicate concept or question ID");
  const active = new Set<string>(),
    done = new Set<string>();
  function visit(id: string) {
    const concept = byId.get(id);
    if (!concept) throw new Error("Unknown prerequisite: " + id);
    if (active.has(id)) throw new Error("Cyclic prerequisite: " + id);
    if (done.has(id)) return;
    active.add(id);
    concept.prerequisites.forEach(visit);
    for (const related of concept.related)
      if (!byId.has(related))
        throw new Error("Unknown related concept: " + related);
    if (problemIds && !problemIds.has(concept.problem))
      throw new Error("Unknown exercise: " + concept.problem);
    active.delete(id);
    done.add(id);
  }
  concepts.forEach((k) => visit(k.id));
  if (new Set(paths.map((path) => path.id)).size !== paths.length)
    throw new Error("Duplicate study path");
  for (const path of paths) {
    const positions = new Map(path.ids.map((id, index) => [id, index]));
    if (positions.size !== path.ids.length)
      throw new Error("Duplicate path concept");
    for (const [id, index] of positions) {
      const concept = byId.get(id);
      if (!concept) throw new Error("Unknown path concept: " + id);
      for (const prerequisite of concept.prerequisites)
        if (
          positions.has(prerequisite) &&
          positions.get(prerequisite)! >= index
        )
          throw new Error("Path prerequisite order: " + id);
    }
  }
}
