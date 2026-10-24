import { writeFile } from "node:fs/promises";
await writeFile(
  new URL("../dist/index.html", import.meta.url),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/ascent/index.html"><title>Ascent</title></head><body><a href="/ascent/index.html">Open Ascent</a></body></html>',
);
