import { readFile, writeFile } from "node:fs/promises";
await writeFile(
  new URL("../dist/index.html", import.meta.url),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/ascent/index.html"><title>Ascent</title></head><body><a href="/ascent/index.html">Open Ascent</a></body></html>',
);

// Portfolio navigation must leave the Space; its app routes remain hash links.
const app = new URL("../dist/ascent/index.html", import.meta.url);
let html = await readFile(app, "utf8");
for (const path of ["/", "/projects/", "/links/", "/about/"]) {
  html = html.replaceAll(`href="${path}"`, `href="https://jacobroutzong.dev${path}"`);
}
await writeFile(app, html);
