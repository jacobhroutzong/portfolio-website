// Versioned boundary shared by the workbench and its eventual same-origin adapter.
export const robotFields = [
  { id: 'time_to_collision_s', label: 'Time to collision', min: 0, max: 10, step: 0.1, value: 1.1, unit: 's', help: 'Predicted time until impact if the entered motion continues.' },
  { id: 'stop_time_s', label: 'Required stopping time', min: 0.2, max: 5, step: 0.1, value: 1.4, unit: 's', help: 'Time needed to stop under the example’s assumptions.' },
  { id: 'localization_sigma_m', label: 'Localization uncertainty', min: 0, max: 2, step: 0.05, value: 0.8, unit: 'm', help: 'Uncertainty in position. Larger values mean less certain localization.' },
];
export const robotActions = ['proceed', 'replan', 'controlled_stop', 'manual_review'];
export const actionLabels = { proceed: 'Proceed', replan: 'Replan path', controlled_stop: 'Protective stop', manual_review: 'Manual review' };
export function validateTelemetry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 3) throw new Error('Provide exactly the three telemetry values.');
  for (const field of robotFields) {
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
export function validateRobotResult(result) {
  const bounded = (v, max) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
  if (!result || result.schemaVersion !== 1 || result.scenario !== 'robot_trajectory' || !robotActions.includes(result.action)) throw new Error('Unexpected scenario, schema or action.');
  if (!bounded(result.confidence, 1) || !bounded(result.risk, 1) || !bounded(result.severity, 4) || !bounded(result.backendElapsedMs, Number.MAX_SAFE_INTEGER)) throw new Error('Missing or invalid model result.');
  const probs = result.probabilities;
  if (!probs || Object.keys(probs).length !== robotActions.length || robotActions.some(key => !bounded(probs[key], 1))) throw new Error('Incomplete action probabilities.');
  // No guessed normalization tolerance: total agreement remains a provider-contract gate.
  if (!result.provenance || ['model', 'sourceRevision', 'requestId'].some(key => typeof result.provenance[key] !== 'string' || !result.provenance[key].trim())) throw new Error('Missing result provenance.');
  return result;
}
