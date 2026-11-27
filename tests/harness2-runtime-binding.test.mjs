import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/api/harness2-lab/[[path]].js';

function send(path, request, runtime) {
  return onRequest({
    request: new Request('https://portfolio.example/api/harness2-lab/' + path, request),
    params: { path: path.split('/') },
    env: { HARNESS2_RUNTIME: { fetch: runtime } },
  });
}

test('streams from the private runtime with the same resume cursor and clean headers', async () => {
  const events = 'id: 14\nevent: done\ndata: {}\n\n';
  const response = await send('runs/10aa20bb30/events', {
    headers: { 'Last-Event-ID': '13', 'Authorization': 'browser-auth', 'Cookie': 'browser-session' },
  }, async (url, init) => {
    assert.equal(url, 'https://harness2-runtime.internal/api/runs/10aa20bb30/events');
    assert.equal(init.redirect, 'manual');
    assert.deepEqual([...init.headers], [['accept', 'text/event-stream'], ['last-event-id', '13']]);
    return new Response(events, { headers: { 'Content-Type': 'text/event-stream', 'Set-Cookie': 'discard' } });
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.has('Set-Cookie'), false);
  assert.equal(await response.text(), events);
});

test('retains run and cancellation methods and fails closed when the binding is unavailable', async () => {
  const input = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"backend":"simulator"}' };
  for (const path of ['runs', 'runs/10aa20bb30/cancel', 'budget-lab']) {
    const response = await send(path, input, async (url, req) => {
      assert.equal(url, 'https://harness2-runtime.internal/api/' + path);
      assert.equal(req.method, 'POST');
      assert.equal(await new Response(req.body).text(), input.body);
      return Response.json({ id: '10aa20bb30' });
    });
    assert.equal(response.status, 200);
  }
  const doNotCall = () => assert.fail('disallowed request reached backend');
  assert.equal((await send('runs/not-an-id/cancel', input, doNotCall)).status, 404);
  assert.equal((await send('runs', { method: 'POST', body: 'invalid' }, doNotCall)).status, 415);
  const failure = await send('meta', {}, () => { throw new Error('Unavailable'); });
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get('Retry-After'), '10');
});
