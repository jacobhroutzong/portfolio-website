import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStudyAccountConfig, safeStudyReturnPath, createProgressTransport, createBoundedAccountFetch } from '../src/scripts/study-account.mjs';

const config = {
  enabled: true,
  url: 'https://grpwacfkhwwifnjantdn.supabase.co',
  publishableKey: 'sb_publishable_example',
  providers: { google: true, apple: false },
  allowedOrigins: ['https://study-preview.example.test'],
};

test('staging account configuration stays off on production and unknown origins', () => {
  assert.equal(resolveStudyAccountConfig(undefined, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig({ ...config, enabled: false }, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig(config, 'https://unapproved.example.test'), null);
  for (const origin of ['https://jacobroutzong.dev', 'https://www.jacobroutzong.dev', 'https://portfolio-site-bs9.pages.dev']) {
    assert.equal(resolveStudyAccountConfig({ ...config, allowedOrigins: [origin] }, origin), null);
  }
  assert.deepEqual(resolveStudyAccountConfig(config, config.allowedOrigins[0]), {
    url: 'https://grpwacfkhwwifnjantdn.supabase.co', publishableKey: 'sb_publishable_example', providers: { google: true, apple: false },
  });
  assert.equal(resolveStudyAccountConfig({ ...config, publishableKey: 'sb_secret_do-not-ship' }, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig({ ...config, url: 'https://other.example.test' }, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig({ ...config, url: 'https://kgbdfvyhgycnxyqatali.supabase.co' }, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig({ ...config, url: 'https://user:pass@example-project.supabase.co' }, config.allowedOrigins[0]), null);
  assert.equal(resolveStudyAccountConfig({ ...config, url: 'https://example-project.supabase.co/anything' }, config.allowedOrigins[0]), null);
});

test('OAuth return paths preserve study lesson links and reject external or arbitrary destinations', () => {
  assert.equal(safeStudyReturnPath('/study/ew/?course=fm312&lesson=fm312-environment#lesson-reader'), '/study/ew/?course=fm312&lesson=fm312-environment#lesson-reader');
  assert.equal(safeStudyReturnPath('/study/17e/acronyms/'), '/study/17e/acronyms/');
  assert.equal(safeStudyReturnPath('/study/ew/?code=private&lesson=ew-fundamentals&access_token=private#access_token=private'), '/study/ew/?lesson=ew-fundamentals');
  for (const value of [undefined, '', '//evil.test/path', '/\\evil.test/path', 'https://evil.test', 'javascript:alert(1)', '/connect/', '/study/account/', '/study/%2e%2e/admin/', '/study/ew/' + 'x'.repeat(2048)]) {
    assert.equal(safeStudyReturnPath(value), '/study/');
  }
});

function fakeClient(result) {
  const calls = [];
  const query = {
    select(...args) { calls.push(['select', ...args]); return this; },
    eq(...args) { calls.push(['eq', ...args]); return this; },
    insert(...args) { calls.push(['insert', ...args]); return this; },
    update(...args) { calls.push(['update', ...args]); return this; },
    abortSignal(signal) { calls.push(['signal', signal]); return this; },
    maybeSingle() { return typeof result === 'function' ? result() : Promise.resolve(result); },
  };
  return {
    calls,
    schema(name) {
      calls.push(['schema', name]);
      return {
        from(table) {
          calls.push(['from', table]);
          return query;
        },
      };
    },
  };
}

test('transport scopes every query to the expected account and uses revision-checked updates', async () => {
  const row = { revision: 5, payload: { completed: { lesson: true }, ratings: {} }, reset: false };
  const client = fakeClient({ data: row, error: null });
  const transport = createProgressTransport(client, () => 'user-a');
  await transport.read('ew', 'user-a');
  assert.deepEqual(client.calls[0], ['schema', 'army_study_api']);
  assert.deepEqual(client.calls[1], ['from', 'army_study_progress']);
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-a'));
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'area' && call[2] === 'ew'));
  client.calls.length = 0;
  assert.deepEqual(await transport.write('ew', 'user-a', 4, row.payload, false), row);
  assert.deepEqual(client.calls.find(call => call[0] === 'update'), ['update', { revision: 5, payload: row.payload, reset: false }]);
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'revision' && call[2] === 4));
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-a'));
  assert.ok(client.calls.some(call => call[0] === 'signal' && call[1] instanceof AbortSignal));
});

test('first save inserts an owned row; concurrent creation and stale updates become conflicts', async () => {
  const payload = { completed: {}, ratings: {} };
  const created = fakeClient({ data: { revision: 1, payload, reset: true }, error: null });
  await createProgressTransport(created, () => 'user-a').write('ew', 'user-a', 0, payload, true);
  assert.deepEqual(created.calls.find(call => call[0] === 'insert'), ['insert', { user_id: 'user-a', area: 'ew', revision: 1, payload, reset: true }]);
  for (const result of [{ data: null, error: null }, { data: null, error: { code: '23505', message: 'duplicate row' } }, { data: null, error: { code: '40001', message: 'stale revision' } }]) {
    const transport = createProgressTransport(fakeClient(result), () => 'user-a');
    await assert.rejects(transport.write('ew', 'user-a', 1, payload, false), { code: 'CONFLICT' });
  }
});

test('transport refuses a foreign account before issuing a request and discards late account replies', async () => {
  let user = 'user-a';
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const client = fakeClient(() => pending);
  const activeRequests = new Set();
  const transport = createProgressTransport(client, () => user, activeRequests);
  await assert.rejects(transport.read('ew', 'user-b'), { code: 'CANCELLED' });
  assert.deepEqual(client.calls, [['schema', 'army_study_api']]);
  const request = transport.read('ew', 'user-a');
  assert.equal(activeRequests.size, 1);
  user = 'user-b';
  for (const controller of activeRequests) controller.abort();
  finish({ data: { revision: 1, payload: {}, reset: false }, error: null });
  await assert.rejects(request, { code: 'CANCELLED' });
  assert.equal(activeRequests.size, 0);
});

test('database access failures remain failures and do not expose provider details', async () => {
  const client = fakeClient({ data: null, error: { code: '42501', message: 'private database diagnostic' } });
  const transport = createProgressTransport(client, () => 'user-a');
  await assert.rejects(transport.read('ew', 'user-a'), { code: '42501', message: 'Account progress could not be loaded.' });
  await assert.rejects(transport.write('ew', 'user-a', 2, {}, false), { code: '42501', message: 'Account progress could not be saved.' });
});

test('SDK fetch retains caller cancellation and bounds a stalled authentication request', async () => {
  const waitingFetch = (_input, options) => new Promise((_resolve, reject) => {
    if (options.signal.aborted) reject(options.signal.reason);
    else options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
  });
  const bounded = createBoundedAccountFetch(waitingFetch, 10);
  await assert.rejects(bounded('https://example.invalid/auth'), { name: 'TimeoutError' });
  const caller = new AbortController();
  const pending = createBoundedAccountFetch(waitingFetch)('https://example.invalid/auth', { signal: caller.signal });
  caller.abort(new DOMException('Signed out.', 'AbortError'));
  await assert.rejects(pending, { name: 'AbortError', message: 'Signed out.' });
  const original = new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  const response = await createBoundedAccountFetch(async () => original)('https://example.invalid/auth');
  assert.equal(response, original);
  assert.deepEqual(await response.json(), { ok: true });
});
