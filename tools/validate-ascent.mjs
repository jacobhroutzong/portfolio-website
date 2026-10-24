import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { lessonSchema, problemSchema, knowledgeSchema } from "../src/lib/ascent/schema.ts";
import { parse } from "yaml";
const lessons = parse(
  await readFile(
    new URL("../content/tracks/lessons.yaml", import.meta.url),
    "utf8",
  ),
);
const problems = parse(
  await readFile(
    new URL("../content/problems/library.yaml", import.meta.url),
    "utf8",
  ),
);
const ids = new Set();
const knowledge=knowledgeSchema.array().parse(JSON.parse(await readFile(new URL('../content/knowledge/library.json',import.meta.url),'utf8')));
if(new Set(knowledge.map(k=>k.id)).size!==knowledge.length)throw new Error('Duplicate knowledge ID');
for(const k of knowledge){for(const id of k.related)if(!knowledge.some(item=>item.id===id))throw new Error('Unknown concept '+id);if(!problems.some(p=>p.id===k.problem))throw new Error('Unknown implementation link '+k.problem);}
console.log(`Validated ${knowledge.length} connected references, primary source dates and original interview questions.`);
for (const lesson of lessons) {
  lessonSchema.parse(lesson);
  if (ids.has(lesson.id)) throw new Error("Duplicate lesson");
  ids.add(lesson.id);
  for (const exercise of lesson.exercises) {
    if (ids.has(exercise.id)) throw new Error("Duplicate exercise");
    ids.add(exercise.id);
  }
}
const python = process.env.ASCENT_PYTHON || "python3";
const solutions = new URL("../content/solutions/", import.meta.url);
if ((await readdir(solutions)).length !== problems.length)
  throw new Error("Solution count mismatch");
let total = 0;
for (const pr of problems) {
  problemSchema.parse(pr);
  if (
    pr.visible.length < 3 ||
    pr.hints.length !== 3 ||
    !pr.editorial ||
    pr.examples.length < 3 ||
    !pr.constraints ||
    !pr.complexity
  )
    throw new Error("Incomplete problem " + pr.id);
  const solution = JSON.parse(
    await readFile(new URL(pr.id + ".json", solutions), "utf8"),
  );
  if (solution.hidden.length < 8) throw new Error("Too few hidden tests");
  const script =
    solution.reference +
    "\n" +
    [...pr.visible, ...solution.hidden].join("\n") +
    "\n";
  const result = spawnSync(python, ["-I", "-c", script], {
    encoding: "utf8",
    timeout: 15000,
  });
  if (result.error || result.status !== 0)
    throw new Error(`${pr.id}: ${result.error ?? result.stderr}`);
  total += pr.visible.length + solution.hidden.length;
  const published = JSON.parse(
    await readFile(
      new URL(`../public/ascent/checks/${pr.id}.json`, import.meta.url),
      "utf8",
    ),
  );
  if (
    JSON.stringify(published.hidden) !== JSON.stringify(solution.hidden) ||
    published.reference !== solution.reference
  )
    throw new Error("Published checks differ: " + pr.id);
}
console.log(
  `Validated ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises, ${problems.length} reference solutions and ${total} Python checks.`,
);
for (const lesson of lessons)
  for (const exercise of lesson.exercises) {
    if (!exercise.code || !exercise.tests) continue;
    const reference =
      exercise.reference ??
      exercise.code.replace("# replace this line", String(exercise.answer));
    const tests = exercise.stages
      ? exercise.stages.flatMap((stage) => stage.tests)
      : [exercise.tests];
    const result = spawnSync(
      python,
      ["-I", "-c", reference + "\n" + tests.join("\n")],
      { encoding: "utf8", timeout: 15000 },
    );
    if (result.error || result.status !== 0)
      throw new Error(exercise.id + ": " + (result.error ?? result.stderr));
  }
const numerics = spawnSync(
  python,
  ["-I", fileURLToPath(new URL("./check-numerics.py", import.meta.url))],
  { encoding: "utf8", timeout: 20000 },
);
if (numerics.error || numerics.status !== 0)
  throw new Error(numerics.error ?? numerics.stderr);
console.log(numerics.stdout.trim());
