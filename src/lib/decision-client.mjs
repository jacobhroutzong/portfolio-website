import { validateTelemetry, validateRobotResult } from './decision-contract.mjs';
export async function evaluateClient(telemetry, signal, fetcher = fetch) {
  validateTelemetry(telemetry);
  const response = await fetcher('/api/decision-engine/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schemaVersion: 1, scenario: 'robot_trajectory', telemetry }), signal });
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Evaluation API is unavailable in this preview.');
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'Evaluation failed.');
  const result = validateRobotResult(data);
  if (Object.keys(telemetry).some(k => result.input?.[k] !== telemetry[k])) throw new Error('Returned telemetry does not match the request.');
  return result;
}
