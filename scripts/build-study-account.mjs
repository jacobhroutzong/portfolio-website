import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const STUDY_STAGING_BRANCH = 'feature/study-accounts-staging';
export const STUDY_STAGING_URL = 'https://grpwacfkhwwifnjantdn.supabase.co';

const STUDY_PRODUCTION_URL = 'https://kgbdfvyhgycnxyqatali.supabase.co';
const STUDY_PRODUCTION_ORIGIN = 'https://jacobroutzong.dev';

const disabledConfig = () => ({
  enabled: false,
  url: '',
  publishableKey: '',
  providers: { google: false, apple: false },
  allowedOrigins: [],
});

/** Restrict account bundles to the approved deployment and its matching project. */
export function resolveStudyAccountConfig(config, env = process.env) {
  const cloudBuild = Boolean(env.CF_PAGES || env.CF_PAGES_BRANCH || env.CF_PAGES_URL);
  if (env.CF_PAGES === '1' && env.CF_PAGES_BRANCH === 'main' && env.STUDY_ACCOUNTS_PRODUCTION_PILOT === '1') {
    const publishableKey = env.STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY;
    if (!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(publishableKey ?? '') || publishableKey === config?.publishableKey) {
      return disabledConfig();
    }
    return {
      enabled: true,
      url: STUDY_PRODUCTION_URL,
      publishableKey,
      providers: { google: true, apple: false },
      allowedOrigins: [STUDY_PRODUCTION_ORIGIN],
    };
  }
  const approvedBuild = env.CF_PAGES_BRANCH === STUDY_STAGING_BRANCH ||
    (!cloudBuild && env.STUDY_ACCOUNTS_STAGING === '1');
  if (!approvedBuild || config?.enabled !== true) return disabledConfig();

  if (config.url !== STUDY_STAGING_URL) {
    throw new Error('Study accounts must use the approved staging Supabase project.');
  }
  if (typeof config.publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(config.publishableKey)) {
    throw new Error('Study accounts require a publishable browser key.');
  }
  if (!Array.isArray(config.allowedOrigins) || config.allowedOrigins.length === 0) {
    throw new Error('Study accounts require an explicit origin allowlist.');
  }
  const allowedOrigins = [...new Set(config.allowedOrigins)];
  for (const origin of allowedOrigins) {
    let url;
    try { url = new URL(origin); } catch { throw new Error('Invalid study account origin.'); }
    const local = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
    if (url.origin !== origin || url.username || url.password || url.hostname.includes('*') ||
        (!local && url.protocol !== 'https:') ||
        ['jacobroutzong.dev', 'www.jacobroutzong.dev'].includes(url.hostname)) {
      throw new Error('Study accounts require exact staging or local origins.');
    }
  }

  return {
    enabled: true,
    url: STUDY_STAGING_URL,
    publishableKey: config.publishableKey,
    providers: { google: config.providers?.google === true, apple: config.providers?.apple === true },
    allowedOrigins,
  };
}

export async function buildStudyAccount({ publicOutput = false, env = process.env } = {}) {
  const buildEnv = publicOutput ? { ...env, STUDY_ACCOUNTS_PRODUCTION_PILOT: '0' } : env;
  const config = resolveStudyAccountConfig(JSON.parse(await readFile(join(root, 'src/config/study-accounts.json'), 'utf8')), buildEnv);
  const outDir = join(root, publicOutput ? 'public/study' : 'dist/study');
  if (!config.enabled) {
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'account.js'), `export async function connectStudyAccount() { return null; }
export async function handleStudyAccountCallback() {
  const status = document.getElementById('study-account-callback-status');
  if (status) status.textContent = 'Account sign-in is not available here. You can return to study as a guest.';
}
`, 'utf8');
    console.log('Study account bundle: guest-only stub.');
    return;
  }
  const { build } = await import('vite');
  await build({
    root,
    configFile: false,
    publicDir: false,
    define: { __STUDY_ACCOUNT_CONFIG__: JSON.stringify(config) },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      copyPublicDir: false,
      lib: {
        entry: join(root, 'src/scripts/study-account.mjs'),
        formats: ['es'],
        fileName: () => 'account.js',
      },
    },
  });
  console.log(config.url === STUDY_PRODUCTION_URL ? 'Study account bundle: production pilot enabled.' : 'Study account bundle: staging enabled.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--public')) throw new Error('Usage: node scripts/build-study-account.mjs [--public]');
  await buildStudyAccount({ publicOutput: args.includes('--public') });
}
