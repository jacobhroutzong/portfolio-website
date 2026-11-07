import metadata from '../data/decision-scenarios.json' with { type: 'json' };

export const robotFields = [
  { id: 'time_to_collision_s', label: 'Time to collision', min: 0, max: 10, step: 0.1, value: 1.1, unit: 's', help: 'Predicted time until impact if the entered motion continues.' },
  { id: 'stop_time_s', label: 'Required stopping time', min: 0.2, max: 5, step: 0.1, value: 1.4, unit: 's', help: 'Time needed to stop under the example’s assumptions.' },
  { id: 'localization_sigma_m', label: 'Localization uncertainty', min: 0, max: 2, step: 0.05, value: 0.8, unit: 'm', help: 'Uncertainty in position. Larger values mean less certain localization.' },
];
export const robotActions = ['proceed', 'replan', 'controlled_stop', 'manual_review'];
export const actionLabels = { proceed: 'Proceed', replan: 'Replan path', controlled_stop: 'Protective stop', manual_review: 'Manual review' };
export const aviationActionLabels = { continue_approach: 'Continue approach', divert_alternate: 'Divert to alternate', emergency_priority: 'ATC emergency priority' };
export const gnssActionLabels = {
  nominal: 'Nominal',
  fading: 'Signal fading',
  jamming: 'Jamming',
  suspected_spoofing: 'Suspected spoofing',
  indeterminate: 'Indeterminate',
};
export const orderBookActionLabels = {
  normal: 'Continue quoting',
  reduce_risk: 'Reduce quoting risk',
  cancel_review: 'Cancel quotes and review',
  strategy_halt: 'Suspend quoting',
};
export const gpuThermalActionLabels = {
  monitor: 'Continue monitoring',
  throttle_review: 'Throttle compute',
  migrate_review: 'Move workloads',
  isolate_escalate: 'Isolate cooling and shut down',
};
const scenarios = new Map([
  ['robot_trajectory', { fields: robotFields, actions: robotActions }],
  ['aviation_operations', { fields: metadata.scenarios.aviation_operations.inputs, actions: Object.keys(aviationActionLabels) }],
  ['gnss_integrity', { fields: metadata.scenarios.gnss_integrity.inputs, actions: Object.keys(gnssActionLabels) }],
  ['lob_risk', { fields: metadata.scenarios.lob_risk.inputs, actions: Object.keys(orderBookActionLabels) }],
  ['gpu_thermal', { fields: metadata.scenarios.gpu_thermal.inputs, actions: Object.keys(gpuThermalActionLabels) }],
]);
export function validateTelemetry(input, scenario = 'robot_trajectory') {
  const fields = scenarios.get(scenario)?.fields;
  if (!fields) throw new Error('Unsupported scenario.');
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== fields.length) throw new Error('Provide exactly the three telemetry values.');
  for (const field of fields) {
    if (!Object.hasOwn(input, field.id)) throw new Error(`Missing telemetry field: ${field.label}.`);
    const value = input[field.id];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max) throw new Error(`${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`);
    if (Math.abs((value - field.min) / field.step - Math.round((value - field.min) / field.step)) > 1e-7) throw new Error(`${field.label} must use steps of ${field.step} ${field.unit}.`);
  }
  return { ...input };
}
export function stoppingMargin(input) {
  validateTelemetry(input);
  return Math.round((input.time_to_collision_s - input.stop_time_s) * 1e6) / 1e6;
}
export function passesThreshold(confidence, threshold) {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !Number.isInteger(threshold) || threshold < 50 || threshold > 99) throw new Error('Invalid confidence or threshold.');
  return confidence * 100 >= threshold;
}
export function validateDecisionResult(result, scenario) {
  const bounded = (v, max) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
  const actions = scenarios.get(scenario)?.actions;
  if (!actions || !result || result.schemaVersion !== 1 || result.scenario !== scenario || !actions.includes(result.action)) throw new Error('Unexpected scenario, schema or action.');
  if (!bounded(result.confidence, 1) || !bounded(result.risk, 1) || !bounded(result.severity, 4) || !bounded(result.backendElapsedMs, Number.MAX_SAFE_INTEGER)) throw new Error('Missing or invalid model result.');
  const probs = result.probabilities;
  if (!probs || Object.keys(probs).length !== actions.length || actions.some(key => !Object.hasOwn(probs, key) || !bounded(probs[key], 1))) throw new Error('Incomplete action probabilities.');
  // SDK specifies approximate totals; candidate policy is .001, with no repair.
  // Confidence is independently returned and need not equal action probability.
  if (Math.abs(Object.values(probs).reduce((sum, p) => sum + p, 0) - 1) > .001 || probs[result.action] < Math.max(...Object.values(probs))) throw new Error('Inconsistent probability distribution.');
  if (!result.provenance || ['model', 'sourceRevision', 'requestId'].some(key => typeof result.provenance[key] !== 'string' || !result.provenance[key].trim())) throw new Error('Missing result provenance.');
  return result;
}
export function validateRobotResult(result) {
  return validateDecisionResult(result, 'robot_trajectory');
}
