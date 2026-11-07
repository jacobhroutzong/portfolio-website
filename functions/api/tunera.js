const UPSTREAM = 'https://jacobroutzong-tuneledger.hf.space/api/tunera/v1';
const MAX_REQUEST_BYTES = 3_100_000;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const mediaType = response => response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();

export async function onRequestPost({ request }) {
  if (mediaType(request) !== 'application/json' || !request.body) {
    return Response.json({ error: 'Expected JSON' }, { status: 415, headers });
  }

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return Response.json({ error: 'Input is too large' }, { status: 413, headers });
    }
    chunks.push(value);
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST', body: new Blob(chunks), redirect: 'manual',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: AbortSignal.timeout(25_000),
    });
    if ([200, 413, 415, 422].includes(upstream.status) && mediaType(upstream) === 'application/json') {
      return Response.json(await upstream.json(), { status: upstream.status, headers });
    }
    await upstream.body?.cancel();
  } catch {
    // The free CPU Space may be asleep or rebuilding.
  }
  return Response.json({ error: 'Tunera is starting up or temporarily unavailable. Try again in a moment.' },
    { status: 503, headers: { ...headers, 'Retry-After': '10' } });
}
