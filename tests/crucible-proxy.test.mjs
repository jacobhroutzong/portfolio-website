import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/crucible/evaluate.js';

const url = 'https://jacobroutzong.dev/api/crucible/evaluate';
const post = (body = '{}', headers = {}) => new Request(url, {
  method: 'POST', body, headers: { 'Content-Type': 'application/json', ...headers },
});

test('Crucible forwards the body to its fixed Python scorer without credentials', async t => {
  const raw = '{"label":"example","cases":[],"predictions":[]}';
  t.mock.method(globalThis, 'fetch', async (destination, options) => {
    assert.equal(destination, 'https://jacobroutzong-modelforge.hf.space/api/evaluate');
    assert.equal(options.redirect, 'manual');
    assert.deepEqual(Object.keys(options.headers).sort(), ['Accept', 'Content-Type']);
    assert.equal(await options.body.text(), raw);
    return Response.json({ storage: 'browser-local' }, { status: 201 });
  });
  const result = await onRequest({ request: post(raw, { Cookie: 'test=1', Authorization: 'test', Origin: new URL(url).origin }) });
  assert.equal(result.status, 201);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await result.json(), { storage: 'browser-local' });
});

test('Crucible blocks unsupported methods, origins, media types and oversized bodies before forwarding', async t => {
  const upstream = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected request'); });
  for (const [request, status] of [
    [new Request(url), 405],
    [post('{}', { Origin: 'https://other.example' }), 403],
    [post('{}', { 'Content-Type': 'text/plain' }), 415],
    [post('x'.repeat(2_000_001)), 413],
  ]) {
    assert.equal((await onRequest({ request })).status, status);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test('Crucible reports upstream validation errors without redirects', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Invalid input' }, { status: 400 }));
  const result = await onRequest({ request: post() });
  assert.equal(result.status, 400);
  assert.equal((await result.json()).error, 'Invalid input');
});

test('Crucible turns a redirect or sleeping Space response into a retryable local error', async t => {
  for (const response of [Response.redirect('https://example.com/'), new Response('<html>Starting</html>')]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response);
    const result = await onRequest({ request: post() });
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('Location'), null);
    assert.equal(result.headers.get('Retry-After'), '10');
    mock.mock.restore();
  }
});
