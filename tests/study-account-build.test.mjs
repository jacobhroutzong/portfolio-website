import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveStudyAccountConfig, STUDY_STAGING_BRANCH, STUDY_STAGING_URL } from '../scripts/build-study-account.mjs';

const config = {
  enabled: true,
  url: STUDY_STAGING_URL,
  publishableKey: 'sb_publishable_' + 'a'.repeat(32),
  providers: { google: true, apple: false },
  allowedOrigins: ['http://127.0.0.1:4321', 'https://study-staging.portfolio-site-bs9.pages.dev'],
};

test('account configuration is disabled on production and unrelated preview builds', () => {
  for (const env of [
    {},
    { CF_PAGES: '1', CF_PAGES_BRANCH: 'main' },
    { CF_PAGES: '1', CF_PAGES_BRANCH: 'main', STUDY_ACCOUNTS_STAGING: '1' },
    { CF_PAGES_BRANCH: 'another-branch', STUDY_ACCOUNTS_STAGING: '1' },
    { CF_PAGES_URL: 'https://example.pages.dev', STUDY_ACCOUNTS_STAGING: '1' },
    { CF_PAGES: '1', STUDY_ACCOUNTS_STAGING: '1' },
  ]) {
    const result = resolveStudyAccountConfig(config, env);
    assert.equal(result.enabled, false);
    assert.equal(result.publishableKey, '');
    assert.deepEqual(result.allowedOrigins, []);
  }
});

test('production pilot requires the Cloudflare main build, an explicit opt-in and a separate publishable key', () => {
  const publishableKey = 'sb_publishable_' + 'b'.repeat(32);
  const production = { CF_PAGES: '1', CF_PAGES_BRANCH: 'main', STUDY_ACCOUNTS_PRODUCTION_PILOT: '1', STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY: publishableKey };
  assert.deepEqual(resolveStudyAccountConfig(config, production), {
    enabled: true,
    url: 'https://kgbdfvyhgycnxyqatali.supabase.co',
    publishableKey,
    providers: { google: true, apple: false },
    allowedOrigins: ['https://jacobroutzong.dev'],
  });
  for (const patch of [
    { CF_PAGES: undefined },
    { CF_PAGES_BRANCH: 'unrelated-preview' },
    { STUDY_ACCOUNTS_PRODUCTION_PILOT: '0' },
    { STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY: undefined },
    { STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY: config.publishableKey },
    { STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY: 'not-a-publishable-key' },
  ]) {
    assert.equal(resolveStudyAccountConfig(config, { ...production, ...patch }).enabled, false);
  }
  assert.equal(resolveStudyAccountConfig(config, { ...production, CF_PAGES_BRANCH: STUDY_STAGING_BRANCH }).url, STUDY_STAGING_URL);
});

test('accounts enable only for the approved staging branch or explicit local test build', () => {
  for (const env of [{ CF_PAGES_BRANCH: STUDY_STAGING_BRANCH }, { STUDY_ACCOUNTS_STAGING: '1' }]) {
    assert.deepEqual(resolveStudyAccountConfig(config, env), config);
    assert.equal(resolveStudyAccountConfig({ ...config, enabled: false }, env).enabled, false);
  }
});

test('an enabled account build rejects other projects, private keys and unsafe origin configurations', () => {
  const env = { CF_PAGES_BRANCH: STUDY_STAGING_BRANCH };
  const rejected = [
    { url: 'https://kgbdfvyhgycnxyqatali.supabase.co' },
    { url: STUDY_STAGING_URL + '/unexpected-path' },
    { publishableKey: 'sb_secret_' + 'a'.repeat(32) },
    { publishableKey: 'not-a-publishable-key' },
    { allowedOrigins: [] },
    { allowedOrigins: ['https://jacobroutzong.dev'] },
    { allowedOrigins: ['https://www.jacobroutzong.dev'] },
    { allowedOrigins: ['https://*.pages.dev'] },
    { allowedOrigins: ['https://example.pages.dev/study/'] },
    { allowedOrigins: ['https://example.pages.dev?redirect=elsewhere'] },
    { allowedOrigins: ['http://example.com'] },
    { allowedOrigins: ['https://user:' + 'password@example.com'] },
    { allowedOrigins: ['invalid'] },
  ];
  for (const patch of rejected) assert.throws(() => resolveStudyAccountConfig({ ...config, ...patch }, env));
});

test('only documented public configuration fields enter the generated browser bundle', () => {
  const result = resolveStudyAccountConfig({ ...config, unrelatedCredential: 'must not enter the bundle' }, { STUDY_ACCOUNTS_STAGING: '1' });
  assert.deepEqual(Object.keys(result).sort(), ['allowedOrigins', 'enabled', 'providers', 'publishableKey', 'url']);
  assert.deepEqual(result.providers, { google: true, apple: false });
});

test('disabled builds generate a small guest stub without bundling account code or connection values', async t => {
  const root = await mkdtemp(join(tmpdir(), 'study-disabled-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'), { recursive: true });
  await mkdir(join(root, 'src/config'), { recursive: true });
  await copyFile(new URL('../scripts/build-study-account.mjs', import.meta.url), join(root, 'scripts/build-study-account.mjs'));
  await writeFile(join(root, 'src/config/study-accounts.json'), JSON.stringify(config));
  // No Vite, account module or SDK exists in this isolated fixture.
  execFileSync(process.execPath, ['scripts/build-study-account.mjs'], {
    cwd: root,
    env: { ...process.env, CF_PAGES: '1', CF_PAGES_BRANCH: 'main', STUDY_ACCOUNTS_STAGING: '1' },
    stdio: 'pipe',
  });
  const output = await readFile(join(root, 'dist/study/account.js'), 'utf8');
  assert.ok(Buffer.byteLength(output) < 1024);
  assert.ok(!output.includes(config.url));
  assert.ok(!output.includes(config.publishableKey));
  assert.doesNotMatch(output, /supabase|createClient|exchangeCodeForSession/);
  const module = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
  assert.equal(await module.connectStudyAccount(), null);
  assert.equal(typeof module.handleStudyAccountCallback, 'function');
  assert.match(output, /Account sign-in is not available here/);
});
