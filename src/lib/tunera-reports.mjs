export const metrics = [
  ['json_parse_rate', 'JSON parse rate', 'Responses that parsed as strict JSON'],
  ['schema_compliance_rate', 'Schema compliance', 'Responses that followed the action contract'],
  ['semantic_success_rate', 'Semantic success', 'Responses with the correct action and arguments'],
  ['tool_selection_accuracy', 'Tool selection', 'Correct tool among expected tool calls'],
  ['clarification_precision', 'Clarification precision', 'Expected clarifications among predicted clarifications'],
  ['clarification_recall', 'Clarification recall', 'Predicted clarifications among expected clarifications'],
];

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function readReport(value) {
  if (!isRecord(value) || typeof value.label !== 'string' || !value.label.trim() || value.label.length > 120 ||
    !Array.isArray(value.cases) || !value.cases.length || value.cases.length > 5000 ||
    value.n_cases !== value.cases.length || !sha(value.sha256?.cases) || !sha(value.sha256?.predictions)) {
    throw new Error('Choose a Crucible saved-output report with case details and hashes.');
  }
  const ids = new Set();
  for (const item of value.cases) {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
      !isRecord(item.expected) || !['clarify', 'tool_call'].includes(item.expected.action) ||
      ![item.json_valid, item.schema_valid, item.success].every(flag => typeof flag === 'boolean') ||
      (item.raw_output !== null && typeof item.raw_output !== 'string') ||
      (item.failure !== undefined && typeof item.failure !== 'string')) {
      throw new Error('The report contains an invalid or duplicate case.');
    }
    ids.add(item.id);
  }
  for (const [key] of metrics) {
    const ratio = value[key];
    if (ratio === null && !['json_parse_rate', 'schema_compliance_rate', 'semantic_success_rate'].includes(key)) continue;
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) throw new Error(`Invalid report metric ${key}.`);
  }
  return value;
}

export function compareReports(left, right) {
  const convention = report => typeof report.created_at === 'string' ? 'parsed-cases' : 'file-bytes';
  const ids = new Set(left.cases.map(item => item.id));
  if (left.sha256.cases !== right.sha256.cases || convention(left) !== convention(right) ||
    ids.size !== right.cases.length || !right.cases.every(item => ids.has(item.id))) return null;
  return metrics.map(([key, label]) => ({ label, left: left[key], right: right[key],
    delta: left[key] === null || right[key] === null ? null : right[key] - left[key] }));
}

export function parseRecords(text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    if (!line.trim()) return [];
    try { return [JSON.parse(line)]; }
    catch { throw new Error(`Invalid JSON on line ${index + 1}.`); }
  });
}

export function estimateMemory(parameters, overhead, budget) {
  return [16, 8, 4].map(bits => {
    const weights = parameters * 1e9 * bits / 8 / 2 ** 30;
    return { bits, weights, total: weights + overhead, headroom: budget - weights - overhead };
  });
}

export function readBenchmarkComparison(value) {
  const { base, fine_tuned: tuned } = value ?? {};
  if (!isRecord(base) || !isRecord(tuned) || base.label !== 'base' || tuned.label !== 'fine_tuned' ||
    !sha(base.suite_sha256) || base.suite_sha256 !== tuned.suite_sha256 || base.count !== tuned.count ||
    !Number.isInteger(base.count) || base.count <= 0 || typeof value.regression_pass !== 'boolean' ||
    typeof base.provenance?.model_id !== 'string' || typeof base.provenance?.revision !== 'string' ||
    !['model_id', 'revision', 'quantized', 'seed', 'smoke_only', 'run_fingerprint'].every(key => base.provenance[key] === tuned.provenance?.[key]) ||
    !isRecord(base.decoding) || !isRecord(tuned.decoding) ||
    !['do_sample', 'max_new_tokens', 'enable_thinking'].every(key => base.decoding[key] === tuned.decoding[key])) {
    throw new Error('Choose a Tunera comparison.json from a matching baseline and fine-tuned run.');
  }
  for (const report of [base, tuned]) {
    if (![report.accuracy, report.structured_validity ?? 0].every(value => Number.isFinite(value) && value >= 0 && value <= 1) ||
      ![report.mean_latency_seconds, report.tokens_per_second ?? 0, report.peak_gpu_bytes ?? 0].every(value => Number.isFinite(value) && value >= 0)) {
      throw new Error('The benchmark contains invalid metric values.');
    }
  }
  return value;
}
