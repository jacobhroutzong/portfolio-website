import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "yaml";
const problems = parse(
  await readFile(
    new URL("../content/problems/library.yaml", import.meta.url),
    "utf8",
  ),
);
for (const problem of problems) {
  if (!/^[a-z0-9-]+$/.test(problem.id)) throw new Error("Unsafe problem slug");
  const solution = JSON.parse(
    await readFile(
      new URL(`../content/solutions/${problem.id}.json`, import.meta.url),
      "utf8",
    ),
  );
  const target = new URL(
    `../public/ascent/checks/${problem.id}.json`,
    import.meta.url,
  );
  await mkdir(new URL(".", target), { recursive: true });
  await writeFile(
    target,
    JSON.stringify({ reference: solution.reference, hidden: solution.hidden }),
  );
}
console.log(`Synchronized ${problems.length} lazy-loaded practice test files.`);
