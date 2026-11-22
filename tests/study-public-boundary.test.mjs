import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const approvedSchema = 'supabase/migrations/20261122184222_army_study_progress.sql';
const checker = new URL('../scripts/check-public-boundary.mjs', import.meta.url);

async function fixture(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'study-boundary-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const contents = {
    'scripts/public-rendered-routes.json': '[]',
    'src/data/public-business-pages.json': '[]',
    ...files,
  };
  contents['scripts/public-repository-files.json'] = JSON.stringify([
    'scripts/check-public-boundary.mjs', 'scripts/public-repository-files.json', ...Object.keys(contents),
  ]);
  for (const [path, value] of Object.entries(contents)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), value);
  }
  await copyFile(checker, join(root, 'scripts/check-public-boundary.mjs'));
  execFileSync('git', ['init', '--quiet', root]);
  return root;
}

function check(root, mode) {
  return spawnSync(process.execPath, ['scripts/check-public-boundary.mjs', mode], { cwd: root, encoding: 'utf8' });
}

test('repository permits only the individually reviewed study migration', async t => {
  const root = await fixture(t, { [approvedSchema]: '-- Public schema, no credentials.\n' });
  assert.equal(check(root, 'repository').status, 0);

  const other = 'supabase/migrations/20990101000000_unreviewed.sql';
  await writeFile(join(root, other), '-- Not an approved public migration.\n');
  // Even an accidental manifest addition must not waive the private-path rule.
  const manifest = JSON.parse(await readFile(join(root, 'scripts/public-repository-files.json'), 'utf8'));
  manifest.push(other);
  await writeFile(join(root, 'scripts/public-repository-files.json'), JSON.stringify(manifest));
  const result = check(root, 'repository');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unapproved repository file/);
});

test('reviewed SQL is still forbidden in public source and built output', async t => {
  const routes = JSON.stringify({ version: 1, include: ['/api/harness2-lab/*'], exclude: [] });
  const root = await fixture(t, {
    'scripts/public-assets.json': JSON.stringify(['_routes.json', approvedSchema]),
    'scripts/public-research-digests.json': '{}',
    'src/data/public-repositories.json': '[]',
    'src/data/activity.json': '{"items":[]}',
    'public/_routes.json': routes,
    ['public/' + approvedSchema]: '-- This schema must not become a static download.\n',
    ['dist/' + approvedSchema]: '-- This schema must not become a static download.\n',
  });
  for (const mode of ['source', 'build']) {
    const result = check(root, mode);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unapproved public asset/);
  }
});

test('reviewed migration exception does not bypass credential scanning', async t => {
  const root = await fixture(t, { [approvedSchema]: '-- sb_secret_' + 'a'.repeat(32) + '\n' });
  const result = check(root, 'repository');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /credential signature/);
});
