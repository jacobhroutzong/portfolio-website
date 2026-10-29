function matrix(text: string, rows: number, columns: number): number[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length !== rows) throw new Error(`Expected ${rows} matrix rows.`);
  return lines.flatMap(line => {
    const tokens = line.trim().split(/[\s,]+/);
    if (tokens.length !== columns) throw new Error(`Each row must contain ${columns} entries.`);
    return tokens.map(token => {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) throw new Error('Use decimal numbers only.');
      const value = Number(token);
      if (!Number.isFinite(value) || Math.abs(value) > 1e100) throw new Error('Entries must be finite with magnitude at most 1e100.');
      return value;
    });
  });
}
export function mountEngineDemos() {
  document.querySelectorAll<HTMLElement>('.cpp-demo').forEach(root => {
    if (root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    const form = root.querySelector('form')!;
    const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
    const cancel = form.querySelector<HTMLButtonElement>('[data-cancel]')!;
    const status = root.querySelector<HTMLElement>('[data-status]')!;
    const output = root.querySelector<HTMLElement>('[data-result]')!;
    const kind = root.dataset.engine!;
    let worker: Worker | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Record<string, unknown> | undefined;
    const busy = (value: boolean) => { submit.disabled = value; cancel.disabled = !worker; root.setAttribute('aria-busy', String(value)); };
    const reset = () => { clearTimeout(timer); worker?.terminate(); worker = undefined; pending = undefined; busy(false); };
    const fail = (message: string) => { reset(); status.textContent = message; };
    const deadline = (ms: number) => { clearTimeout(timer); timer = setTimeout(() => fail('Time limit reached. Worker terminated; reduce the input and retry.'), ms); };
    const run = () => { status.textContent = 'Computing in C++…'; deadline(5000); worker!.postMessage(pending); };
    cancel.addEventListener('click', () => { reset(); output.textContent = ''; status.textContent = 'Cancelled. Engine worker reset.'; });
    window.addEventListener('pagehide', reset, { once: true });
    form.addEventListener('submit', event => {
      event.preventDefault(); output.textContent = '';
      try {
        const data = new FormData(form);
        if (kind === 'numerical') {
          const n = Number(data.get('order')), r = Number(data.get('rhs'));
          if (!Number.isInteger(n) || n < 1 || n > 16 || !Number.isInteger(r) || r < 1 || r > 4) throw new Error('Matrix order 1–16; RHS count 1–4.');
          pending = { type: 'run', kind, wire: [n, r, ...matrix(String(data.get('a')), n, n), ...matrix(String(data.get('b')), n, r)].join(' ') };
        } else {
          const expression = String(data.get('expression')), variable = String(data.get('variable'));
          if (expression.length > 256 || !/^[\x20-\x7e]+$/.test(expression) || !/^[A-Za-z_][A-Za-z_0-9]{0,31}$/.test(variable)) throw new Error('Use a short ASCII expression and a valid variable name.');
          pending = { type: 'run', kind, expression, variable };
        }
        busy(true);
        if (worker) { run(); return; }
        status.textContent = 'Loading C++ WebAssembly engine…'; deadline(20000);
        worker = new Worker('/scientific-engine.worker.js', { type: 'module' }); busy(true);
        worker.onerror = () => fail('C++ engine could not load or stopped. Build the local WebAssembly artifacts and retry.');
        worker.onmessage = ({ data: message }) => {
          if (message.type === 'ready') { run(); return; }
          clearTimeout(timer);
          if (message.type === 'failure') { fail(`Engine unavailable: ${message.error}. Local WASM artifacts may be missing.`); return; }
          const result = message.result;
          if (!result.ok) { status.textContent = `Input rejected: ${result.error}`; busy(false); return; }
          output.textContent = kind === 'numerical'
            ? `Solution X (rows):\n${result.x.map((row: number[]) => row.join('  ')).join('\n')}\nSequential pivot rows (zero-based): ${result.pivots.join(', ')}\nScaled backward error: ${result.backwardError}\nINFO: ${result.info}`
            : `Canonical: ${result.canonical}\nDerivative: ${result.derivative}\nOriginal-domain conditions: ${result.conditions.length ? result.conditions.map((c: string) => `${c} ≠ 0`).join('; ') : 'none within the supported exact domain'}`;
          status.textContent = 'Complete. Computed by the C++ engine.'; busy(false);
        };
        worker.postMessage({ type: 'load', kind });
      } catch (error) { status.textContent = error instanceof Error ? error.message : 'Invalid input'; busy(false); }
    });
  });
}
