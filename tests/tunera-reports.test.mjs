import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { compareReports, estimateMemory, parseRecords, readBenchmarkComparison, readReport } from '../src/lib/tunera-reports.mjs';

const fixture = JSON.parse(readFileSync(new URL('../public/apps/crucible/fixture.json', import.meta.url), 'utf8'));

test('historical Crucible reports round-trip without rewriting metrics, hashes or failures', () => {
  const report = structuredClone(fixture.runs[0]);
  assert.deepEqual(JSON.parse(JSON.stringify(readReport(report))), fixture.runs[0]);
  assert.equal(report.n_cases, 8);
  assert.equal(report.json_parse_rate, 0.875);
  assert.equal(report.schema_compliance_rate, 0.875);
  assert.equal(report.semantic_success_rate, 0.5);
  assert.ok(report.cases.some(row => row.failure === 'semantic_mismatch'));
  assert.throws(() => readReport({ ...report, schema_compliance_rate: 2 }), /Invalid report metric/);
  assert.throws(() => readReport({ ...report, cases: report.cases.map(() => report.cases[0]) }), /duplicate case/);
});

test('comparison gates deltas on case identity and compatible hash conventions', () => {
  const left = readReport(fixture.runs[0]);
  const right = readReport({ ...left, semantic_success_rate: 0.75, clarification_precision: null });
  const deltas = compareReports(left, right);
  assert.equal(deltas.find(item => item.label === 'Semantic success').delta, 0.25);
  assert.equal(deltas.find(item => item.label === 'Clarification precision').delta, null);
  assert.equal(compareReports(left, { ...right, sha256: { ...right.sha256, cases: 'f'.repeat(64) } }), null);
  const { created_at: stamp, ...cli } = right;
  assert.ok(stamp);
  assert.equal(compareReports(left, readReport(cli)), null);
});

test('JSONL errors identify the source line and memory estimates use GiB', () => {
  assert.deepEqual(parseRecords('\n{"id":"a"}\r\n'), [{ id: 'a' }]);
  assert.throws(() => parseRecords('\n{"id":"a"}\nno'), /line 3/);
  const [bf16, int8, int4] = estimateMemory(2, 3, 8);
  assert.equal(bf16.weights, 4e9 / 2 ** 30);
  assert.equal(int8.weights, bf16.weights / 2);
  assert.equal(int4.total, bf16.weights / 4 + 3);
  assert.ok(bf16.headroom > 0);
});

test('CLI benchmark import keeps measured values and rejects incompatible revisions', () => {
  const base = { label: 'base', suite_sha256: 'a'.repeat(64), count: 3, accuracy: 0.5,
    structured_validity: null, mean_latency_seconds: 0.25, tokens_per_second: 16, peak_gpu_bytes: 1024,
    decoding: { do_sample: false, max_new_tokens: 64, enable_thinking: false },
    provenance: { model_id: 'Qwen/Qwen3-4B', revision: 'pinned', quantized: true, seed: 42 } };
  const fine_tuned = { ...base, label: 'fine_tuned', accuracy: 0.75 };
  const comparison = { base, fine_tuned, regression_pass: true };
  assert.equal(readBenchmarkComparison(comparison), comparison);
  assert.throws(() => readBenchmarkComparison({ ...comparison,
    fine_tuned: { ...fine_tuned, provenance: { ...base.provenance, revision: 'different' } } }), /matching baseline/);
});
