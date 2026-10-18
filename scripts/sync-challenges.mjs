import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateIndex, canonicalIndex } from './metadata.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root,'src/data/challenges.json');
let source;
if (process.env.CHALLENGE_INDEX_FILE) source = await readFile(resolve(process.env.CHALLENGE_INDEX_FILE),'utf8');
else if (process.env.CHALLENGE_INDEX_URL) {
  const url = new URL(process.env.CHALLENGE_INDEX_URL);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Challenge index URL must use HTTPS without credentials');
  const response = await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});
  if (!response.ok) throw new Error(`Challenge index download failed: ${response.status}`);
  source = await response.text();
  if (source.length > 5_000_000) throw new Error('Challenge index exceeds 5 MB');
} else source = await readFile(destination,'utf8');
const index = validateIndex(JSON.parse(source));
await writeFile(destination,canonicalIndex(index.repositoryUrl,index.solutions));
console.log(`Challenge snapshot: ${index.solutions.length} validated real solutions.`);
