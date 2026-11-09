import { lstat, readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mode = process.argv[2];
if (!['source', 'build'].includes(mode)) throw new Error('Expected source or build');
const directory = join(root, mode === 'source' ? 'public' : 'dist');
const approved = new Set(JSON.parse(await readFile(join(root, 'scripts/public-assets.json'), 'utf8')));
const activityUrls = new Set(JSON.parse(await readFile(join(root, 'src/data/public-repositories.json'), 'utf8')));
const activity = JSON.parse(await readFile(join(root, 'src/data/activity.json'), 'utf8'));
if (activity.items.some(item => !activityUrls.has(item.url))) throw new Error('The activity snapshot contains an unapproved URL');

const forbidden = /(?:^|\/)(?:\.env(?:\.|$)|\.wrangler(?:\/|$)|(?:migrations|downloads)(?:\/|$))|^(?:equityscout|ascent|apps\/(?:equityscout|lintel|leverline|crucible))(?:\/|$)|\.(?:zip|tar|gz|sql|db|sqlite3?|pem|pfx|jsonl|map)$/i;
const generated = /^media\/generated\/(.+)-(?:[1-9]\d{0,3})\.webp$/;
const built = /^(?:_astro\/[\w./@()-]+\.(?:js|css|woff2?|ttf|svg|png|webp)|(?:[\w-]+\/)*[\w-]+\.html|(?:robots\.txt|sitemap\.xml))$/;
const failures = [];
let total = 0;
async function walk(dir) {
  for (const entry of await readdir(dir)) {
    const file = join(dir, entry);
    const path = relative(directory, file).replaceAll('\\', '/');
    const type = await lstat(file);
    if (type.isSymbolicLink()) { failures.push(path); continue; }
    if (type.isDirectory()) { await walk(file); continue; }
    total++;
    const derived = generated.exec(path);
    if (!type.isFile() || forbidden.test(path) || (!approved.has(path) && !(derived && Number(path.match(/-(\d+)\.webp$/)?.[1]) <= 1920 && approved.has('media/' + derived[1])) && !(mode === 'build' && built.test(path)))) {
      failures.push(path);
    }
  }
}
await walk(directory);
const routes = JSON.parse(await readFile(join(root, 'public/_routes.json'), 'utf8'));
if (JSON.stringify(routes) !== JSON.stringify({version: 1, include: ['/api/harness2-lab/*'], exclude: []})) failures.push('public/_routes.json');
const functionRoot = join(root, 'functions');
async function functions(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await functions(file);
    else if (entry.isSymbolicLink() || relative(functionRoot, file).replaceAll('\\', '/') !== 'api/harness2-lab/[[path]].js') failures.push(relative(root, file));
  }
}
await functions(functionRoot);
if (failures.length) throw new Error('Unapproved public paths:\n' + failures.sort().join('\n'));
console.log('Public ' + mode + ' boundary checked: ' + total + ' files.');
