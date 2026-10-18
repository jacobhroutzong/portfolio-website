import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const files = [];
async function walk(dir) { for (const e of await readdir(dir,{withFileTypes:true})) { const path = resolve(dir,e.name); if (e.isDirectory()) await walk(path); else if (e.name.endsWith('.html')) files.push(path); } }
await walk(root);
const errors = [];
let references = 0;
for (const file of files) {
  const html = await readFile(file,'utf8');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;','&');
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(raw)) continue;
    if (!raw || /^(javascript:|undefined$)/.test(raw)) { errors.push(`${relative(root,file)}: invalid URL ${raw}`); continue; }
    const url = new URL(raw,`https://local.test/${relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'')}`);
    const path = decodeURIComponent(url.pathname);
    let target = resolve(root,`.${path}`);
    if (relative(root,target).startsWith('..')) { errors.push(`Escaping path ${raw}`); continue; }
    try { if ((await stat(target)).isDirectory()) target = resolve(target,'index.html'); await stat(target); } catch { errors.push(`${relative(root,file)}: missing ${raw}`); continue; }
    if (url.hash && target.endsWith('.html')) {
      const targetHtml = target === file ? html : await readFile(target,'utf8');
      if (!targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) errors.push(`${relative(root,file)}: missing anchor ${raw}`);
    }
    references++;
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; } else console.log(`Internal links and assets: ${references} references checked across ${files.length} HTML pages.`);
