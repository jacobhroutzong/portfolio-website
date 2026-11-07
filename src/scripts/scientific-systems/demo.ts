function matrix(text: string, rows: number, columns: number, label: string): number[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length !== rows) throw new Error(`${label}: expected ${rows} rows, found ${lines.length}.`);
  return lines.flatMap((line, row) => {
    const tokens = line.trim().split(/[\s,]+/);
    if (tokens.length !== columns) throw new Error(`${label}, row ${row + 1}: expected ${columns} entries, found ${tokens.length}.`);
    return tokens.map((token, column) => {
      const cell = `${label}, row ${row + 1}, column ${column + 1}`;
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) throw new Error(`${cell}: use decimal numbers only.`);
      const value = Number(token);
      if (!Number.isFinite(value) || Math.abs(value) > 1e100) throw new Error(`${cell}: entries must be finite with magnitude at most 1e100.`);
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
    const note = root.querySelector<HTMLElement>('[data-example-note]')!;
    const panel = root.querySelector<HTMLElement>('[data-panel]')!;
    const primary = root.querySelector<HTMLElement>('[data-primary]')!;
    const output = root.querySelector<HTMLElement>('[data-result]')!;
    const diagnostics = root.querySelector<HTMLDetailsElement>('[data-diagnostics]')!;
    const conditions = root.querySelector<HTMLElement>('[data-conditions]');
    const kind = root.dataset.engine!;
    let worker: Worker | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Record<string, unknown> | undefined;

    const finish = () => {
      clearTimeout(timer);
      pending = undefined;
      submit.disabled = false;
      cancel.disabled = !worker;
    };
    const reset = () => {
      worker?.terminate();
      worker = undefined;
      finish();
    };
    const clearResult = () => {
      panel.hidden = true;
      diagnostics.open = false;
      primary.textContent = '';
      output.textContent = '';
      if (conditions) conditions.textContent = '';
    };
    const invalidate = () => {
      // Worker identity guards any reply already queued when the inputs change.
      if (pending) reset();
      clearResult();
      status.textContent = 'Inputs changed. Run the engine to compute a new result.';
    };
    const fail = (message: string) => {
      reset();
      status.textContent = message;
    };
    const deadline = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => fail('Time limit reached. Worker terminated; reduce the input and retry.'), ms);
    };
    const run = () => {
      status.textContent = 'Computing in C++…';
      deadline(5000);
      worker!.postMessage(pending);
    };
    cancel.addEventListener('click', () => {
      reset();
      clearResult();
      status.textContent = 'Cancelled. Engine worker reset.';
      submit.focus();
    });
    window.addEventListener('pagehide', () => {
      if (pending) invalidate();
      reset();
    });
    form.addEventListener('input', () => {
      note.textContent = '';
      invalidate();
    });
    form.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button => {
      button.addEventListener('click', () => {
        const values = JSON.parse(button.dataset.example!) as Record<string, string>;
        for (const [name, value] of Object.entries(values)) {
          const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
          field.value = value;
        }
        invalidate();
        note.textContent = button.dataset.note ?? '';
      });
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (pending) return;
      clearResult();
      try {
        const data = new FormData(form);
        if (kind === 'numerical') {
          const n = Number(data.get('order')), r = Number(data.get('rhs'));
          if (!Number.isInteger(n) || n < 1 || n > 16 || !Number.isInteger(r) || r < 1 || r > 4) throw new Error('Matrix order 1–16; RHS count 1–4.');
          pending = { type: 'run', kind, wire: [n, r, ...matrix(String(data.get('a')), n, n, 'Matrix A'), ...matrix(String(data.get('b')), n, r, 'Matrix B')].join(' ') };
        } else {
          const expression = String(data.get('expression')), variable = String(data.get('variable'));
          if (expression.length > 256 || !/^[\x20-\x7e]+$/.test(expression) || !/^[A-Za-z_][A-Za-z_0-9]{0,31}$/.test(variable)) throw new Error('Use a short ASCII expression and a valid variable name.');
          pending = { type: 'run', kind, expression, variable };
        }
        submit.disabled = true;
        if (worker) { run(); return; }
        status.textContent = 'Loading C++ WebAssembly engine…';
        deadline(20000);
        const active = new Worker('/scientific-engine.worker.js', { type: 'module' });
        worker = active;
        cancel.disabled = false;
        active.onerror = () => {
          if (worker === active) fail('C++ engine could not load or stopped. Reload the page and retry.');
        };
        active.onmessage = ({ data: message }) => {
          if (worker !== active || !pending) return;
          if (message.type === 'ready') { run(); return; }
          if (message.type === 'failure') { fail(`Engine unavailable: ${message.error}. Reload the page and retry.`); return; }
          finish();
          const result = message.result;
          if (!result.ok) { status.textContent = `Input rejected: ${result.error}`; return; }
          if (kind === 'numerical') {
            primary.textContent = result.x.map((row: number[]) => row.join('  ')).join('\n');
            output.textContent = `Sequential pivot rows (zero-based): ${result.pivots.join(', ')}\nScaled backward error: ${result.backwardError}\nINFO: ${result.info}`;
          } else {
            primary.textContent = result.derivative;
            conditions!.textContent = result.conditions.length ? result.conditions.map((c: string) => `${c} ≠ 0`).join('; ') : 'None within the supported exact domain.';
            output.textContent = `Canonical: ${result.canonical}`;
          }
          panel.hidden = false;
          status.textContent = 'Complete. Computed by the C++ engine.';
        };
        active.postMessage({ type: 'load', kind });
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Invalid input');
      }
    });
  });
}
