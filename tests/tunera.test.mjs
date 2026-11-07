import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/tunera.js';

function request(body, type = 'application/json') {
  return new Request('https://jacobroutzong.dev/api/tunera', {
    method: 'POST', body, headers: { 'Content-Type': type, Cookie: 'site-session=example' },
  });
}

test('Tunera forwards JSON only to its fixed CPU endpoint, without visitor cookies', async t => {
  const body = JSON.stringify({ action: 'plan', size: '4B', context: 512, rank: 16, steps: 100 });
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({ config: {} }));
  const response = await onRequestPost({ request: request(body) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { config: {} });
  assert.equal(upstream.mock.callCount(), 1);
  const [url, init] = upstream.mock.calls[0].arguments;
  assert.equal(url, 'https://jacobroutzong-tuneledger.hf.space/api/tunera/v1');
  assert.equal(init.redirect, 'manual');
  assert.equal(new Headers(init.headers).has('cookie'), false);
  assert.equal(await init.body.text(), body);
});

test('Tunera keeps input errors and translates Space redirects and cold starts', async t => {
  const responses = [Response.json({ error: 'Invalid JSON' }, { status: 422 }),
    Response.redirect('https://huggingface.co/'), new Response('<html>Sleeping</html>')];
  const upstream = t.mock.method(globalThis, 'fetch', async () => responses.shift());
  const inputError = await onRequestPost({ request: request('{}') });
  assert.equal(inputError.status, 422);
  assert.deepEqual(await inputError.json(), { error: 'Invalid JSON' });
  for (let i = 0; i < 2; i++) {
    const unavailable = await onRequestPost({ request: request('{}') });
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('location'), null);
    assert.match((await unavailable.json()).error, /try again/i);
  }
  assert.equal((await onRequestPost({ request: request('{}', 'text/plain') })).status, 415);
  assert.equal((await onRequestPost({ request: request(' '.repeat(3_100_001)) })).status, 413);
  assert.equal(upstream.mock.callCount(), 3);
});
