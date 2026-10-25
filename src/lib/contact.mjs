export function validateContact(input) {
  const fields = {};
  for (const key of ['name', 'email', 'message']) fields[key] = String(input[key] || '').trim();
  if (fields.name.length < 2 || fields.name.length > 100) throw new Error('Enter a name between 2 and 100 characters.');
  if (fields.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new Error('Enter a valid reply email.');
  if (fields.message.length < 10 || fields.message.length > 5000) throw new Error('Write a message between 10 and 5,000 characters.');
  if (!input.consent) throw new Error('Please agree to send your details through FormSubmit.');
  if (String(input.website || '').trim()) throw new Error('Submission could not be accepted.');
  return fields;
}

export async function submitContact(input, recipient, request = fetch) {
  const fields = validateContact(input);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Contact recipient is not configured.');
  const response = await request('https://formsubmit.co/ajax/' + encodeURIComponent(recipient), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...fields, _subject: 'Portfolio contact — Jacob Routzong', _template: 'table', _honey: '' }),
    signal: AbortSignal.timeout(20000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('The contact service returned an unexpected response. Please try again or email Jacob directly.'); }
  if (!response.ok) throw new Error('The contact service is unavailable. Please try again or email Jacob directly.');
  if (/activat|confirm your email|check your (?:inbox|email)/i.test(String(result.message || ''))) return { status: 'pending' };
  if (![true, 'true'].includes(result.success)) throw new Error('The contact service could not accept your message. Please try again or email Jacob directly.');
  return { status: 'accepted' };
}
