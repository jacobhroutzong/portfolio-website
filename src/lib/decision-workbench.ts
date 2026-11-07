import { passesThreshold } from './decision-contract.mjs';
import { evaluateScenario } from './decision-client.mjs';

export function bindDecisionEvaluation(form: HTMLFormElement, scenario: string, actionLabels: Record<string, string>) {
  const output = (id: string, text: string) => { document.getElementById(id)!.textContent = text; };
  const run = form.querySelector<HTMLButtonElement>('.dw-run')!;
  const cancel = document.querySelector<HTMLButtonElement>('#cancel-evaluation')!;
  const thresholdInput = document.querySelector<HTMLInputElement>('#threshold')!;
  const modelResult = document.querySelector<HTMLElement>('#model-result')!;
  const resultMessage = document.querySelector<HTMLElement>('#result-message')!;
  const audit = document.querySelector<HTMLElement>('#model-audit')!;
  const timing = document.querySelector<HTMLElement>('#model-timing')!;
  const viewDecision = document.querySelector<HTMLAnchorElement>('#view-decision')!;
  const probabilityRows = modelResult.querySelectorAll<HTMLTableRowElement>('[data-action]');
  let controller: AbortController | undefined;
  let revision = 0;
  let ready = false;
  let lastResult: Awaited<ReturnType<typeof evaluateScenario>> | undefined;

  function showState(state: string, message: string) {
    output('result-state', state);
    resultMessage.hidden = false;
    resultMessage.textContent = message;
  }

  function invalidate() {
    if (controller || lastResult) showState('Inputs changed', 'Run another evaluation to see results for the new telemetry.');
    if (controller) output('connection-status', 'Stopped waiting after an input change. Backend work may continue.');
    revision++; controller?.abort(); controller = undefined; lastResult = undefined;
    cancel.hidden = true; run.disabled = !ready;
    modelResult.hidden = true; audit.hidden = true; timing.hidden = true; viewDecision.hidden = true;
  }

  function renderThreshold(confidence: number) {
    const threshold = thresholdInput.valueAsNumber;
    const passes = passesThreshold(confidence, threshold);
    output('model-threshold', passes ? `Meets ${threshold}% threshold` : `Below ${threshold}% · review`);
  }

  function renderResult(result: NonNullable<typeof lastResult>, roundTripMs: number) {
    const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
    const action = actionLabels[result.action];
    output('model-action', action);
    output('model-confidence', percent(result.confidence));
    output('model-risk', percent(result.risk));
    output('model-severity', `${result.severity.toFixed(2)} / 4`);
    renderThreshold(result.confidence);
    for (const row of probabilityRows) {
      const key = row.dataset.action!;
      const probability = result.probabilities[key];
      row.toggleAttribute('data-recommended', key === result.action);
      row.querySelector<HTMLElement>('.dw-probability-bar > span')!.style.width = `${probability * 100}%`;
      row.querySelector<HTMLElement>('.dw-probability-value')!.textContent = percent(probability);
    }
    output('model-audit', JSON.stringify(result, null, 2));
    output('model-timing', `Backend evaluation: ${result.backendElapsedMs.toFixed(0)} ms. End to end: ${roundTripMs.toFixed(0)} ms.`);
    output('result-state', 'Complete');
    resultMessage.hidden = true; modelResult.hidden = false; audit.hidden = false; timing.hidden = false; viewDecision.hidden = false;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || controller || !form.reportValidity()) return;
    invalidate(); const current = revision; controller = new AbortController(); const active = controller;
    run.disabled = true; cancel.hidden = false;
    showState('Evaluating', 'Waiting for the model’s response…');
    output('connection-status', 'One request is in progress.');
    const timer = setTimeout(() => active.abort('timeout'), 35000); const start = performance.now();
    try {
      const telemetry = Object.fromEntries(Array.from(form.querySelectorAll<HTMLInputElement>('input[type=number]'), input => [input.name, input.valueAsNumber]));
      const result = await evaluateScenario(scenario, telemetry, active.signal);
      if (current !== revision) return;
      lastResult = result; renderResult(result, performance.now() - start); output('connection-status', `Evaluation complete. Recommended action: ${actionLabels[result.action]}.`);
    } catch (error) {
      if (current !== revision) return;
      const state = active.signal.reason === 'timeout' ? 'Timed out' : active.signal.aborted ? 'Waiting cancelled' : 'Evaluation failed';
      showState(state, active.signal.aborted ? 'The backend may still be processing this request.' : error instanceof Error ? error.message : 'The evaluation could not be completed.');
      output('connection-status', `${state}. No automatic retry was made.`);
    } finally {
      clearTimeout(timer);
      if (current === revision) {
        const returnFocus = document.activeElement === cancel;
        controller = undefined; cancel.hidden = true; run.disabled = !ready;
        if (returnFocus) run.focus();
      }
    }
  });
  cancel.addEventListener('click', () => controller?.abort());
  if (import.meta.env.DEV) {
    output('connection-status', 'Checking evaluation availability…');
    fetch('/api/decision-engine/evaluate', { signal: AbortSignal.timeout(5000) }).then(async response => {
      if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json') || (await response.json()).ready !== true) return;
      ready = true;
      run.disabled = false;
      output('connection-status', 'Protected evaluation ready.');
      showState('Not run', 'Run an evaluation to see the model’s decision.');
    }).catch(() => {}).finally(() => {
      if (!ready) output('connection-status', 'Model evaluation is disabled or unavailable in this preview.');
    });
  }
  function updateThreshold() {
    output('threshold-value', `${thresholdInput.value}%`);
    thresholdInput.setAttribute('aria-valuetext', `${thresholdInput.value} percent`);
    if (lastResult) renderThreshold(lastResult.confidence);
  }
  form.addEventListener('input', event => {
    if (event.target === thresholdInput) updateThreshold();
    else invalidate();
  });
  form.addEventListener('reset', () => {
    thresholdInput.value = thresholdInput.defaultValue;
    updateThreshold();
    invalidate();
  });
  return invalidate;
}
