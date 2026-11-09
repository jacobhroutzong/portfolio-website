import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mode = process.argv[2];
const totals = new Map();
const credentialRules = [
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|hf_[A-Za-z0-9]{28,}|(?:AKIA|ASIA)[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{35}|sk-proj-[A-Za-z0-9_-]{28,}|(?:sk|rk)_live_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{12,})\b/,
  /(?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^/\s:@"]{1,80}:[^/\s@"]{5,120}@/,
];
const mapDirective = /(?:\/\/[#@]|\/\*[#@])\s*sourceMappingURL\s*=/i;
const privatePath = /(?:^|\/)(?:\.wrangler|migrations|downloads|node_modules)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|^(?:equityscout|ascent|apps\/(?:equityscout|lintel|leverline|crucible))(?:\/|$)|\.(?:zip|tar|gz|sql|db|sqlite3?|pem|pfx|jsonl|map|parquet|xlsx?|docx?|bak)$/i;
const privateSource = /^(?:src\/lib\/(?:equityscout|ascent|decision-|tunera)|src\/pages\/(?:apps\/|ascent\/|projects\/decision-intelligence-engine\/workbench)|functions\/api\/(?:equityscout|tunera|crucible)|tests\/(?:scout|ascent|tunera|fixtures\/))|^public\/(?:equityscout|ascent|downloads|apps\/(?:equityscout|lintel|leverline|crucible))(?:\/|$)/i;
const generated = /^media\/generated\/(.+)-([1-9]\d{0,3})\.webp$/;
const astroBundle = /^_astro\/[\w./@()-]+\.(?:js|css|woff2?|ttf|svg|png|webp)$/;
const textAsset = /\.(?:[cm]?js|tsx?|astro|css|html|jsonc?|svg|md|txt|ya?ml|toml|xml|ini|sh|py|example)$/i;

function fail(kind) {
  totals.set(kind, (totals.get(kind) ?? 0) + 1);
}

const json = async path => JSON.parse(await readFile(join(root, path), 'utf8'));

async function inspect(directory, path, pins = {}) {
  const stat = await lstat(join(directory, path));
  if (!stat.isFile() || stat.isSymbolicLink()) { fail('nonregular file'); return; }
  if (stat.size > 32 * 1024 * 1024) { fail('oversized input'); return; }
  const text = textAsset.test(path);
  const contents = await readFile(join(directory, path));
  if (!text && !pins[path] && !contents.subarray(0, 8192).includes(0)) {
    if (credentialRules.some(rule => rule.test(contents.toString('utf8')))) fail('credential signature');
  }
  if (text) {
    const value = contents.toString('utf8');
    if (credentialRules.some(rule => rule.test(value))) fail('credential signature');
    if (mode !== 'repository' && mapDirective.test(value)) fail('source map directive');
  }
  if (Object.hasOwn(pins, path)) {
    const input = text ? contents.toString('utf8').replaceAll('\r\n', '\n') : contents;
    if (createHash('sha256').update(input).digest('hex') !== pins[path]) fail('research asset digest');
  }
}

async function repository() {
  const approved = new Set(await json('scripts/public-repository-files.json'));
  const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {cwd:root,stdio:['ignore','pipe','ignore']})
    .toString('utf8').split('\0').filter(Boolean);
  for (const path of new Set(paths)) {
    if (!approved.has(path) || privateSource.test(path) || (path !== '.env.example' && privatePath.test(path))) {
      fail('unapproved repository file');
      continue;
    }
    await inspect(root, path);
  }
  return paths.length;
}

async function output() {
  const approved = new Set(await json('scripts/public-assets.json'));
  const routes = new Set(await json('scripts/public-rendered-routes.json'));
  const pins = await json('scripts/public-research-digests.json');
  const activityUrls = new Set(await json('src/data/public-repositories.json'));
  if ((await json('src/data/activity.json')).items.some(item => !activityUrls.has(item.url))) fail('unapproved activity entry');
  const directory = join(root, mode === 'source' ? 'public' : 'dist');
  const seen = new Set();
  async function walk(path = '') {
    for (const entry of await readdir(join(directory, path), {withFileTypes:true})) {
      const file = path ? path + '/' + entry.name : entry.name;
      if (entry.isDirectory()) { await walk(file); continue; }
      seen.add(file);
      const derived = generated.exec(file);
      const approvedImage = derived && Number(derived[2]) <= 1920 && approved.has('media/' + derived[1]);
      if (privatePath.test(file) || (!approved.has(file) && !approvedImage && !(mode === 'build' && (routes.has(file) || astroBundle.test(file))))) {
        fail('unapproved public asset');
        continue;
      }
      await inspect(directory, file, pins);
    }
  }
  await walk();
  for (const expected of Object.keys(pins)) if (!seen.has(expected)) fail('missing research asset');
  for (const expected of routes) if (mode === 'build' && !seen.has(expected)) fail('missing rendered route');
  const config = await json('public/_routes.json');
  if (JSON.stringify(config) !== JSON.stringify({version:1, include:['/api/harness2-lab/*'], exclude:[]})) fail('unexpected Function routes');
  return seen.size;
}

try {
  if (!['repository','source','build'].includes(mode)) throw new Error();
  const count = await (mode === 'repository' ? repository() : output());
  if (totals.size) {
    for (const [kind, count] of totals) console.error('Public boundary rejected ' + count + ' item(s): ' + kind + '.');
    process.exitCode = 1;
  } else {
    console.log('Public ' + mode + ' boundary checked: ' + count + ' files.');
  }
} catch {
  console.error('Public boundary check could not complete. Review the checkout and manifests locally.');
  process.exitCode = 1;
}
