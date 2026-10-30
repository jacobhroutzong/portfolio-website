// Deliberately closed until protected compute + durable shared quota are verified.
// Do not add a secret-only forwarding switch: it would omit the release safeguards.
export function onRequest() {
  return new Response(JSON.stringify({ code: 'NOT_READY', message: 'Model evaluation is not connected in this preview. Use the existing application for all seven scenarios.' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
