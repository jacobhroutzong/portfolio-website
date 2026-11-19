export const ridgeRows = [
  [1, 2, 3],
  [2, 4, 8],
  [3, 6, 10],
] as const;
export const maxLambda = 100;
export const gradientTolerance = 1e-10;
export const referenceTolerance = 1e-12;

type Engine = 'symbolic' | 'numerical';
type Result<T> = ({ ok: true } & T) | { ok: false; error: string };
type Reply<T> = { type: 'ready' } | { type: 'result'; result: Result<T> } | { type: 'failure'; error: string };

function runEngine<T>(kind: Engine, requests: Record<string, string>[], signal: AbortSignal) {
  return new Promise<Result<T>[]>((resolve, reject) => {
    signal.throwIfAborted();
    const worker = new Worker('/scientific-engine.worker.js', { type: 'module' });
    const results: Result<T>[] = [];
    let timer: ReturnType<typeof setTimeout>;

    function close() {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.terminate();
    }
    function fail(error: unknown) {
      close();
      reject(error);
    }
    function abort() {
      fail(signal.reason);
    }
    function deadline(stage: 'load' | 'computation', ms: number) {
      clearTimeout(timer);
      timer = setTimeout(() => fail(new Error('The ' + kind + ' engine ' + stage + ' timed out. Retry the fit.')), ms);
    }
    function sendNext() {
      deadline('computation', 5000);
      worker.postMessage({ type: 'run', kind, ...requests[results.length] });
    }

    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => fail(new Error('The ' + kind + ' engine stopped. Retry the fit.'));
    worker.onmessageerror = () => fail(new Error('The ' + kind + ' engine returned an unreadable result.'));
    worker.onmessage = ({ data }: MessageEvent<Reply<T>>) => {
      if (data.type === 'failure') {
        fail(new Error('The ' + kind + ' engine is unavailable: ' + data.error));
      } else if (data.type === 'ready') {
        sendNext();
      } else {
        results.push(data.result);
        if (data.result.ok && results.length < requests.length) {
          sendNext();
        } else {
          close();
          resolve(results);
        }
      }
    };

    deadline('load', 20000);
    worker.postMessage({ type: 'load', kind });
  });
}

async function fitRidge(lambda: number, signal: AbortSignal, progress: (message: string) => void) {
  const residualTerms = ridgeRows.map(([x1, x2, y]) => '(' + x1 + '*a+' + x2 + '*b-' + y + ')^2');
  const loss = [...residualTerms, lambda + '*(a^2+b^2)'].join('+');
  progress('Differentiating the loss in symbolic WebAssembly…');
  const derivatives = await runEngine<{ derivative: string; conditions: string[] }>(
    'symbolic', ['a', 'b'].map(variable => ({ expression: loss, variable })), signal,
  );
  const partials = derivatives.map(result => {
    if (!result.ok) throw new Error('Symbolic input rejected: ' + result.error);
    if (!result.derivative || result.conditions.length) {
      throw new Error('The symbolic engine did not return an unrestricted polynomial derivative.');
    }
    return result.derivative;
  });

  // The linear coefficients of half the gradient are XᵀX + λI and Xᵀy.
  let aa = lambda, ab = 0, bb = lambda, ay = 0, by = 0;
  for (const [x1, x2, y] of ridgeRows) {
    aa += x1 * x1;
    ab += x1 * x2;
    bb += x2 * x2;
    ay += x1 * y;
    by += x2 * y;
  }
  progress('Solving the stationarity system in numerical WebAssembly…');
  const [solution] = await runEngine<{ x: number[][] }>(
    'numerical', [{ wire: [2, 1, aa, ab, ab, bb, ay, by].join(' ') }], signal,
  );
  if (!solution.ok) {
    const hint = lambda === 0 ? ' Use λ greater than zero for these collinear features.' : '';
    throw new Error('Numerical solve rejected: ' + solution.error + '.' + hint);
  }
  const a = solution.x[0]?.[0], b = solution.x[1]?.[0];
  if (lambda === 0 || !Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('The numerical engine did not return a valid unique fit.');
  }

  const residuals = ridgeRows.map(([x1, x2, y]) => x1 * a + x2 * b - y);
  const gradient = [
    2 * ridgeRows.reduce((sum, [x1], row) => sum + x1 * residuals[row], lambda * a),
    2 * ridgeRows.reduce((sum, [, x2], row) => sum + x2 * residuals[row], lambda * b),
  ];

  // Independent one-direction projection for X = u [1, 2].
  const dot = ridgeRows.reduce((sum, [u, , y]) => sum + u * y, 0);
  const normSquared = ridgeRows.reduce((sum, [u]) => sum + u * u, 0);
  const referenceA = dot / (5 * normSquared + lambda);
  const reference = [referenceA, 2 * referenceA];
  const error = Math.max(Math.abs(a - reference[0]), Math.abs(b - reference[1]));
  if (error > referenceTolerance || gradient.some(value => Math.abs(value) > gradientTolerance)) {
    throw new Error('The WASM fit failed the reference or gradient tolerance. No fit is shown.');
  }

  return {
    loss, partialA: partials[0], partialB: partials[1],
    system: '[' + aa + ', ' + ab + '; ' + ab + ', ' + bb + '] [a; b] = [' + ay + '; ' + by + ']',
    fit: [a, b], reference, residuals, gradient, error,
  };
}

export function mountRidgePilot(root: HTMLElement) {
  const form = root.querySelector('form')!;
  const input = form.querySelector('input')!;
  const run = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const cancel = form.querySelector<HTMLButtonElement>('[data-cancel]')!;
  const status = root.querySelector<HTMLElement>('[role=status]')!;
  const resultPanel = root.querySelector<HTMLElement>('[data-ridge-result]')!;
  let active: AbortController | undefined;

  function reset(message: string) {
    active?.abort();
    active = undefined;
    run.disabled = false;
    cancel.disabled = true;
    resultPanel.hidden = true;
    status.textContent = message;
  }

  input.addEventListener('input', () => reset('λ changed. Run the fit to update the results.'));
  input.addEventListener('invalid', () => reset('Enter a whole number from 0 to ' + maxLambda + ' for λ.'));
  cancel.addEventListener('click', () => {
    reset('Fit cancelled.');
    run.focus();
  });
  window.addEventListener('pagehide', () => {
    if (active) reset('Fit cancelled.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (active) return;
    const lambda = input.valueAsNumber;
    if (!Number.isInteger(lambda) || lambda < 0 || lambda > maxLambda) {
      reset('Enter a whole number from 0 to ' + maxLambda + ' for λ.');
      input.focus();
      return;
    }

    const controller = new AbortController();
    active = controller;
    resultPanel.hidden = true;
    run.disabled = true;
    cancel.disabled = false;

    try {
      const result = await fitRidge(lambda, controller.signal, message => { status.textContent = message; });
      if (active !== controller) return;
      const format = (number: number) => number.toPrecision(12);
      for (const [key, value] of Object.entries(result)) {
        const text = Array.isArray(value) ? value.map(format).join(', ') :
          typeof value === 'number' ? format(value) : value;
        resultPanel.querySelector<HTMLElement>('[data-output="' + key + '"]')!.textContent = text;
      }
      resultPanel.hidden = false;
      status.textContent = 'Fit complete. Both checks passed.';
    } catch (error) {
      if (active === controller) {
        status.textContent = error instanceof Error ? error.message : 'The fit failed. Retry the calculation.';
      }
    } finally {
      if (active === controller) {
        active = undefined;
        run.disabled = false;
        cancel.disabled = true;
      }
    }
  });

  run.disabled = false;
}
