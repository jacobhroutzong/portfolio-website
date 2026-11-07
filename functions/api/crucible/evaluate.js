const upstreamUrl = 'https://jacobroutzong-modelforge.hf.space/api/evaluate';
const limit = 2_000_000;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const mediaType = message => message.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
const error = (message, status) => Response.json({ error: message }, { status, headers });

export async function onRequest({ request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Use POST to score an evaluation.' },
      { status: 405, headers: { ...headers, Allow: 'POST' } });
  }
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return error('Use the Crucible workspace on this site.', 403);
  }
  if (mediaType(request) !== 'application/json' || !request.body) {
    return error('Expected a JSON evaluation.', 415);
  }
  if (Number(request.headers.get('Content-Length')) > limit) {
    return error('Evaluation input exceeds 2 MB.', 413);
  }

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return error('Evaluation input exceeds 2 MB.', 413);
      }
      chunks.push(value);
    }
  } catch {
    return error('Could not read the evaluation input.', 400);
  }
  if (!size) return error('Evaluation input is empty.', 400);

  try {
    // Forward only the evaluation body. No browser cookies, credentials or origin headers.
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      body: new Blob(chunks),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(25_000),
    });
    if ([201, 400, 413].includes(upstream.status) && mediaType(upstream) === 'application/json') {
      return Response.json(await upstream.json(), { status: upstream.status, headers });
    }
    await upstream.body?.cancel();
  } catch {
    // The CPU Space can be asleep or rebuilding.
  }
  return Response.json({ error: 'The scorer is starting up or temporarily unavailable. Try again in a moment.' },
    { status: 503, headers: { ...headers, 'Retry-After': '10' } });
}
