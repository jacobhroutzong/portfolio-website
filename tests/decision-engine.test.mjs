import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { robotFields, validateTelemetry, stoppingMargin, passesThreshold, validateRobotResult } from '../src/lib/decision-contract.mjs';
import { onRequest } from '../functions/api/decision-engine/evaluate.js';
const metadata = JSON.parse(readFileSync(new URL('../src/data/decision-scenarios.json', import.meta.url)));
const baseline = Object.fromEntries(robotFields.map(f => [f.id, f.value]));
test('all seven source scenarios retained; robotics fields match source', () => {
  assert.equal(Object.keys(metadata.scenarios).length, 7);
  for (const field of robotFields) {
    const source = metadata.scenarios.robot_trajectory.inputs.find(f => f.id === field.id);
    for (const key of ['min', 'max', 'step', 'value', 'unit']) assert.equal(field[key], source[key]);
  }
});
test('local arithmetic and valid zero inputs', () => {
  assert.equal(stoppingMargin(baseline), -0.3);
  assert.equal(stoppingMargin({ ...baseline, time_to_collision_s: 0, localization_sigma_m: 0 }), -1.4);
});
test('reject missing, extra, coerced, nonfinite, off-step and out-of-range inputs', () => {
  for (const input of [{}, { ...baseline, extra: 0 }, { ...baseline, stop_time_s: '' }, { ...baseline, stop_time_s: NaN }, { ...baseline, stop_time_s: Infinity }, { ...baseline, stop_time_s: 0 }, { ...baseline, time_to_collision_s: 1.15 }]) assert.throws(() => validateTelemetry(input));
});
test('threshold includes equality and rejects invalid settings', () => {
  assert.equal(passesThreshold(0.85, 85), true);
  assert.equal(passesThreshold(0.849, 85), false);
  assert.throws(() => passesThreshold(0.9, 100));
});
const result = { schemaVersion: 1, scenario: 'robot_trajectory', action: 'manual_review', confidence: 0, risk: 0, severity: 0, backendElapsedMs: 0, probabilities: { proceed: 0, replan: 0, controlled_stop: 0, manual_review: 1 }, provenance: { model: 'test-fixture-only', sourceRevision: 'fixture', requestId: 'fixture' } };
test('valid zeros survive; incomplete/malformed results never become zero', () => {
  assert.equal(validateRobotResult(result).confidence, 0);
  for (const change of [{ risk: undefined }, { confidence: NaN }, { severity: 5 }, { action: 'unknown' }, { probabilities: {} }, { provenance: {} }]) assert.throws(() => validateRobotResult({ ...result, ...change }));
});
test('unconfigured API never dispatches computation', async () => {
  const res = onRequest();
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal((await res.json()).code, 'NOT_READY');
});
