import { cp, mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();
const output = new URL(
  `../artifacts/huggingface/ascent-${Date.now()}/`,
  import.meta.url,
);
await mkdir(output, { recursive: true });
await cp(new URL("../dist/", import.meta.url), output, { recursive: true });
await writeFile(
  new URL("index.html", output),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/ascent/"><title>Ascent · AI knowledge workspace</title></head><body><a href="/ascent/">Open Ascent</a></body></html>',
);
await writeFile(
  new URL("README.md", output),
  `---\ntitle: Ascent\nemoji: 🌄\ncolorFrom: green\ncolorTo: gray\nsdk: static\napp_file: dist/index.html\napp_build_command: node build.mjs\nfullWidth: true\nshort_description: Advanced AI knowledge and research engineering practice\n---\n\n# Ascent\n\nAn intermediate/advanced AI knowledge workspace by Jacob Routzong.\n\n24 connected technical references, 24 original interview questions, and 20 executable Python problems. Search concepts, follow study paths, write explanations, compare rubrics, and schedule reviews. Python runs in disposable browser workers. Progress stays in your browser, with JSON export/import.\n\n[Source and setup](https://github.com/jacobhroutzong/portfolio-website/tree/codex/ascent-ai-lab-prep) · [Portfolio](https://jacobroutzong.dev)\n\nSource revision: ${revision}. Static deployment; no server model inference, accounts, API keys, or analytics. First Python execution needs a runtime download. Hidden practice tests are inspectable static files. Scores are advisory self-assessments, not hiring predictions.\n`,
);
await readFile(new URL("ascent/index.html", output));
const assets = {};
async function collect(dir, prefix = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const key = prefix + entry.name;
    if (entry.isDirectory())
      await collect(new URL(entry.name + "/", dir), key + "/");
    else if (key !== "README.md")
      assets[key] = (await readFile(new URL(entry.name, dir))).toString(
        "base64",
      );
  }
}
await collect(output);
const upload = new URL("upload/", output);
await mkdir(upload);
await cp(new URL("README.md", output), new URL("README.md", upload));
await writeFile(new URL("assets.json", upload), JSON.stringify(assets));
await writeFile(
  new URL("build.mjs", upload),
  `import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
const root = resolve("dist");
const assets = JSON.parse(await readFile("assets.json", "utf8"));
for (const [name, data] of Object.entries(assets)) {
  const target = resolve(root, name);
  if (!target.startsWith(root + sep)) throw new Error("Unsafe asset path");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(data, "base64"));
}
console.log("Restored " + Object.keys(assets).length + " verified static assets.");
`,
);
console.log(upload.pathname.replace(/^\/(\w:)/, "$1"));
