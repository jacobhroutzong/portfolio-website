const SPACE = 'https://jacobroutzong-harness2-lab.hf.space';
const ROUTES = {
  GET: /^(meta|budget-lab|runs\/[a-f0-9]{10}(\/events)?)$/,
  POST: /^(runs|budget-lab|runs\/[a-f0-9]{10}\/cancel)$/,
};

function unavailable() {
  return Response.json(
    { detail: 'The lab backend is starting up or temporarily unavailable. Try again shortly.' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '10' } },
  );
}

export async function onRequest({ request, params, env }) {
  const path = params.path?.join('/') ?? '';
  const method = request.method;
  if (!Object.hasOwn(ROUTES, method) || !ROUTES[method].test(path)) {
    return new Response(null, { status: 404 });
  }

  const stream = path.endsWith('/events');
  const headers = new Headers({ Accept: stream ? 'text/event-stream' : 'application/json' });
  let body;
  if (method === 'POST') {
    const type = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
    if (type !== 'application/json') {
      return Response.json({ detail: 'Expected a JSON request.' }, { status: 415 });
    }
    headers.set('Content-Type', 'application/json');
    body = request.body;
  }
  const lastEventId = request.headers.get('Last-Event-ID');
  if (stream && lastEventId) headers.set('Last-Event-ID', lastEventId);

  let upstream;
  try {
    const options = { method, headers, body, redirect: 'manual' };
    // The service binding is private and selected only by the Pages environment.
    const runtime = env?.HARNESS2_RUNTIME;
    upstream = runtime
      ? await runtime.fetch(`https://harness2-runtime.internal/api/${path}`, options)
      : await fetch(`${SPACE}/api/${path}`, options);
  } catch {
    return unavailable();
  }

  const type = upstream.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  const expected = stream && upstream.ok ? 'text/event-stream' : 'application/json';
  if (upstream.status >= 500 || (upstream.status >= 300 && upstream.status < 400) || type !== expected) {
    await upstream.body?.cancel();
    return unavailable();
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': expected, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
