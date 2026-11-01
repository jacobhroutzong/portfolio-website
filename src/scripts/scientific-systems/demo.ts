import {
  parseMatrixText, reshapeMatrixText, residualMatrix, rowOrderFromPivots, formatNumber, logPosition,
  parseExpression, toLatex, freeVariables, sampleFunction, derivativeCrossCheck, expressionAdvice, treeSvg, plotSvg,
} from '../../lib/scientific-ui.mjs';

type Tree = ReturnType<typeof parseExpression>;
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const q = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector)!;

// ----- Numerical -----
interface NumericalRun { n: number; r: number; a: number[]; b: number[]; }
interface NumericalResult { x: number[][]; pivots: number[]; backwardError: number; info: number; }

function renderPreview(target: HTMLElement, parsed: ReturnType<typeof parseMatrixText>, name: string) {
  const rows = parsed.cells.map((row: { text: string; ok: boolean }[]) => `<tr>${row.map(cell => `<td class="${cell.ok ? '' : 'bad'}">${esc(cell.text)}</td>`).join('')}</tr>`).join('');
  target.innerHTML = `<table class="lab-matrix" aria-label="${name} as parsed"><tbody>${rows}</tbody></table>`;
}

function numericalView(root: HTMLElement) {
  const form = q<HTMLFormElement>(root, 'form');
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
  const out = q<HTMLElement>(root, '[data-results]');
  const note = q<HTMLElement>(root, '[data-validation]');
  const dims = () => ({ n: Number(field('order').value), r: Number(field('rhs').value) });
  const dimsOk = () => { const { n, r } = dims(); return Number.isInteger(n) && n >= 1 && n <= 16 && Number.isInteger(r) && r >= 1 && r <= 4; };

  function validate() {
    if (!dimsOk()) { note.textContent = 'Matrix order must be a whole number from 1 to 16 and right-hand sides from 1 to 4.'; return null; }
    const { n, r } = dims();
    const A = parseMatrixText(field('a').value, n, n, 'Matrix A');
    const B = parseMatrixText(field('b').value, n, r, 'Matrix B');
    renderPreview(q(root, '[data-preview=a]'), A, 'Matrix A');
    renderPreview(q(root, '[data-preview=b]'), B, 'Matrix B');
    const problems = [...A.problems.map(p => `A: ${p.message}`), ...B.problems.map(p => `B: ${p.message}`)];
    note.textContent = problems.length ? problems.slice(0, 3).join(' ') + (problems.length > 3 ? ` (${problems.length - 3} more)` : '') : '';
    note.classList.toggle('is-error', problems.length > 0);
    return problems.length ? null : { n, r, a: A.values!, b: B.values! } as NumericalRun;
  }
  form.addEventListener('input', validate);
  for (const name of ['order', 'rhs']) field(name).addEventListener('change', () => {
    if (!dimsOk()) { validate(); return; }
    const { n, r } = dims();
    field('a').value = reshapeMatrixText(field('a').value, n, n, true);
    field('b').value = reshapeMatrixText(field('b').value, n, r, false);
    validate();
  });
  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const preset = JSON.parse(button.dataset.preset!);
    field('order').value = String(preset.order); field('rhs').value = String(preset.rhs);
    field('a').value = preset.a; field('b').value = preset.b;
    out.hidden = true; q(root, '[data-preset-note]').textContent = preset.note;
    root.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    validate();
  }));
  validate();

  return {
    collect() {
      const run = validate();
      if (!run) throw new Error(note.textContent || 'Check the matrix entries.');
      return { run, message: { type: 'run', kind: 'numerical', wire: [run.n, run.r, ...run.a, ...run.b].join(' ') } };
    },
    render(run: NumericalRun, result: NumericalResult) {
      const residual = residualMatrix(run.a, result.x, run.b, run.n, run.r);
      const maxResidual = Math.max(...residual.flat().map(Math.abs));
      const order = rowOrderFromPivots(result.pivots);
      const table = (label: string, rows: string[][], cellClass: (r: number, c: number) => string = () => '', style: (r: number, c: number) => string = () => '') =>
        `<table class="lab-matrix" aria-label="${label}"><tbody>${rows.map((row, i) => `<tr>${row.map((cell, j) => `<td class="${cellClass(i, j)}" style="${style(i, j)}">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      const heat = (value: number) => (logPosition(Math.abs(value), -18, 0) * 70).toFixed(0);
      const u = 1.1102230246251565e-16;
      const marker = logPosition(u) * 100, pos = logPosition(result.backwardError) * 100;
      const swaps = result.pivots.map((p, k) => p === k ? null : `step ${k + 1}: swap row ${k + 1} ↔ row ${p + 1}`).filter(Boolean);
      out.hidden = false;
      out.innerHTML = `
        <div class="wb-panel"><h3>Solution X</h3>${table('Solution X', result.x.map(row => row.map(formatNumber)))}<p class="wb-cap">Each column solves A·x = b for the matching column of B.</p></div>
        <div class="wb-panel"><h3>Pivoting</h3><p class="wb-big">${order.map((i: number) => `<span class="chip">row ${i + 1}</span>`).join('<span aria-hidden="true">›</span>')}</p><p class="wb-cap">Rows of A in elimination order. ${swaps.length ? esc(swaps.join('; ')) + '.' : 'No row swaps were needed.'} The engine returns the pivot rows, not the L and U factors; see the recorded LU example for factors.</p></div>
        <div class="wb-panel"><h3>Residual A·X − B</h3>${table('Residual magnitude per entry', residual.map(row => row.map(formatNumber)), () => 'heat', (i, j) => `--w:${heat(residual[i][j])}%`)}<p class="wb-cap">Largest |entry|: <strong>${esc(formatNumber(maxResidual))}</strong>. Computed in your browser from the engine’s X in binary64, so it includes rounding in this check itself. Darker means larger.</p></div>
        <div class="wb-panel"><h3>Scaled backward error</h3><p class="wb-big mono">${esc(formatNumber(result.backwardError))}</p>
          <div class="gauge" role="img" aria-label="Backward error ${esc(formatNumber(result.backwardError))} on a log scale from 1e-18 to 1; unit roundoff is about 1.1e-16"><div class="gauge-track"></div><span class="gauge-u" style="left:${marker}%"></span><span class="gauge-v" style="left:${pos}%"></span></div>
          <div class="gauge-scale" aria-hidden="true"><span>10⁻¹⁸</span><span>10⁻¹²</span><span>10⁻⁶</span><span>1</span></div>
          <p class="wb-cap">${result.backwardError === 0 ? 'Exactly zero for this input: the computed X satisfies A·X = B with no rounding error left over. ' : ''}Reported by the engine. The tick marks unit roundoff (≈1.1 × 10⁻¹⁶); results near it are as backward-stable as binary64 allows. A small value does not promise an accurate X when A is ill-conditioned. INFO = ${result.info}.</p></div>
        <div class="wb-panel wb-compare"><h3>LU and QR</h3><dl><div><dt>LU with partial pivoting</dt><dd>Run live above by the C++ engine.</dd></div><div><dt>Householder QR</dt><dd>Implemented and tested in the native C++ library. This browser build does not expose it, so no QR result is shown or estimated.</dd></div></dl></div>`;
    },
    format(r: NumericalResult) {
      return `Solution X (rows):\n${r.x.map(row => row.join('  ')).join('\n')}\nSequential pivot rows (zero-based): ${r.pivots.join(', ')}\nScaled backward error: ${r.backwardError}\nINFO: ${r.info}`;
    },
    clear() { out.hidden = true; out.innerHTML = ''; },
  };
}

// ----- Symbolic -----
interface SymbolicResult { canonical: string; derivative: string; conditions: string[]; }

function symbolicView(root: HTMLElement) {
  const form = q<HTMLFormElement>(root, 'form');
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const out = q<HTMLElement>(root, '[data-results]');
  const note = q<HTMLElement>(root, '[data-validation]');
  let state: { f: Tree; df: Tree; variable: string; plottable: boolean } | undefined;

  function advise() {
    const notes = expressionAdvice(field('expression').value, field('variable').value);
    note.innerHTML = notes.map(n => `<span class="${n.level === 'error' ? 'is-error' : 'is-warn'}">${esc(n.message)}</span>`).join(' ');
    return notes;
  }
  form.addEventListener('input', advise);
  root.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button => button.addEventListener('click', () => {
    field('expression').value = button.dataset.example!; if (button.dataset.variable) field('variable').value = button.dataset.variable;
    q(root, '[data-example-note]').textContent = button.dataset.note || '';
    root.querySelectorAll('[data-example]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    out.hidden = true; advise();
  }));
  advise();

  function drawPlot() {
    if (!state) return;
    const host = q<HTMLElement>(out, '[data-plot]');
    const min = Number(q<HTMLInputElement>(out, '[name=xmin]').value), max = Number(q<HTMLInputElement>(out, '[name=xmax]').value);
    if (!(Number.isFinite(min) && Number.isFinite(max) && min < max && max - min <= 1000)) { host.innerHTML = '<p class="wb-cap is-error">Enter a range where the minimum is below the maximum (width up to 1000).</p>'; return; }
    const svg = plotSvg([{ name: `f(${state.variable})`, points: sampleFunction(state.f, state.variable, min, max) }, { name: `f′(${state.variable})`, points: sampleFunction(state.df, state.variable, min, max) }], min, max);
    host.innerHTML = svg ?? '<p class="wb-cap">Nothing finite to draw in this range.</p>';
  }

  return {
    collect() {
      const expression = field('expression').value, variable = field('variable').value;
      if (expression.length > 256 || !/^[\x20-\x7e]+$/.test(expression) || !/^[A-Za-z_][A-Za-z_0-9]{0,31}$/.test(variable)) throw new Error('Use a short ASCII expression and a valid variable name.');
      return { run: undefined, message: { type: 'run', kind: 'symbolic', expression, variable } };
    },
    async render(_run: unknown, result: SymbolicResult) {
      const variable = field('variable').value;
      let typeset: (formula: string) => string = () => '', f: Tree | undefined, df: Tree | undefined;
      try {
        const { default: katex } = await import('katex');
        f = parseExpression(result.canonical); df = parseExpression(result.derivative);
        typeset = (formula: string) => katex.renderToString(formula, { throwOnError: false, trust: false, output: 'htmlAndMathml' });
      } catch { f = undefined; df = undefined; }
      const conds = result.conditions.length
        ? `<ul class="wb-conds">${result.conditions.map(c => `<li><code>${esc(c)} ≠ 0</code> The original expression is undefined there, and the derivative keeps that restriction.</li>`).join('')}</ul>`
        : '<p class="wb-cap">None within the supported exact domain.</p>';
      const vars = f ? freeVariables(f) : new Set<string>();
      const plottable = !!f && !!df && [...vars, ...freeVariables(df)].every(v => v === variable);
      out.hidden = false;
      out.innerHTML = `
        <div class="wb-panel wb-wide"><h3>From input to derivative</h3>
          <ol class="pipeline">
            <li><span class="step-label">You typed</span><code>${esc(field('expression').value)}</code></li>
            <li><span class="step-label">Engine’s reading (canonical)</span>${f ? `<div class="formula" data-f></div>` : ''}<code>${esc(result.canonical)}</code></li>
            <li><span class="step-label">d/d${esc(variable)} (exact)</span>${df ? `<div class="formula" data-df></div>` : ''}<code>${esc(result.derivative)}</code></li>
          </ol>
          <p class="wb-cap">Typeset from the engine’s printed strings. The step-by-step rewrite trace is part of the native library and is not returned by this browser build.</p></div>
        ${f ? `<div class="wb-panel"><h3>How the engine read it</h3><div class="tree-scroll" tabindex="0" role="region" aria-label="Expression tree of the canonical form">${treeSvg(f, `Expression tree of ${result.canonical}`)}</div><p class="wb-cap">Operators sit above their operands. The canonical form is fully parenthesized, so grouping is exactly what the engine used.</p></div>` : ''}
        <div class="wb-panel"><h3>Domain conditions</h3>${conds}</div>
        ${plottable ? `<div class="wb-panel wb-wide"><h3>f and f′ drawn</h3>
          <div class="plot-range"><label>From ${esc(variable)} =<input name="xmin" type="number" value="-5" step="any" inputmode="decimal"></label><label>to<input name="xmax" type="number" value="5" step="any" inputmode="decimal"></label></div>
          <div data-plot></div>
          <ul class="legend"><li><i class="s0"></i> f(${esc(variable)}) from the canonical string</li><li><i class="s1"></i> f′(${esc(variable)}) from the derivative string</li></ul>
          <p class="wb-cap" data-check></p>
          <p class="wb-cap">Drawn in your browser by evaluating the engine’s two output strings in binary64. The engine itself does not plot. Gaps are points where the expression is undefined.</p></div>` : ''}`;
      if (f) { q(out, '[data-f]').innerHTML = typeset(toLatex(f)); }
      if (df) { q(out, '[data-df]').innerHTML = typeset(toLatex(df)); }
      if (plottable && f && df) {
        state = { f, df, variable, plottable };
        drawPlot();
        const check = derivativeCrossCheck(f, df, variable, -5, 5);
        q(out, '[data-check]').textContent = check.used
          ? `Cross-check: a central difference of f agrees with f′ to within ${formatNumber(check.worst)} (relative to max(1, |f′|)) at ${check.used} sampled points between −5 and 5.`
          : 'Cross-check skipped: no well-behaved sample points in −5 to 5.';
        out.querySelectorAll('[name=xmin],[name=xmax]').forEach(input => input.addEventListener('input', drawPlot));
      } else state = undefined;
    },
    format(r: SymbolicResult) {
      return `Canonical: ${r.canonical}\nDerivative: ${r.derivative}\nOriginal-domain conditions: ${r.conditions.length ? r.conditions.map(c => `${c} ≠ 0`).join('; ') : 'none within the supported exact domain'}`;
    },
    clear() { out.hidden = true; out.innerHTML = ''; state = undefined; },
  };
}

// ----- Shared worker lifecycle (limits, messages and deadlines are unchanged) -----
export function mountEngineDemos() {
  document.querySelectorAll<HTMLElement>('.cpp-demo').forEach(root => {
    if (root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    const form = q<HTMLFormElement>(root, 'form');
    const submit = q<HTMLButtonElement>(form, '[type=submit]');
    const cancel = q<HTMLButtonElement>(form, '[data-cancel]');
    const status = q<HTMLElement>(root, '[data-status]');
    const output = q<HTMLElement>(root, '[data-result]');
    const kind = root.dataset.engine!;
    const view = kind === 'numerical' ? numericalView(root) : symbolicView(root);
    let worker: Worker | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Record<string, unknown> | undefined, pendingRun: unknown;
    const busy = (value: boolean) => { submit.disabled = value; cancel.disabled = !worker; root.setAttribute('aria-busy', String(value)); };
    const reset = () => { clearTimeout(timer); worker?.terminate(); worker = undefined; pending = undefined; busy(false); };
    const fail = (message: string) => { reset(); status.textContent = message; };
    const deadline = (ms: number) => { clearTimeout(timer); timer = setTimeout(() => fail('Time limit reached. Worker terminated; reduce the input and retry.'), ms); };
    const run = () => { status.textContent = 'Computing in C++…'; deadline(5000); worker!.postMessage(pending); };
    cancel.addEventListener('click', () => { reset(); output.textContent = ''; view.clear(); status.textContent = 'Cancelled. Engine worker reset.'; });
    window.addEventListener('pagehide', reset, { once: true });
    form.addEventListener('submit', event => {
      event.preventDefault(); output.textContent = ''; view.clear();
      try {
        const collected = view.collect();
        pending = collected.message; pendingRun = collected.run;
        busy(true);
        if (worker) { run(); return; }
        status.textContent = 'Loading C++ WebAssembly engine…'; deadline(20000);
        worker = new Worker('/scientific-engine.worker.js', { type: 'module' }); busy(true);
        worker.onerror = () => fail('C++ engine could not load or stopped. Build the local WebAssembly artifacts and retry.');
        worker.onmessage = async ({ data: message }) => {
          if (message.type === 'ready') { run(); return; }
          clearTimeout(timer);
          if (message.type === 'failure') { fail(`Engine unavailable: ${message.error}. Local WASM artifacts may be missing.`); return; }
          const result = message.result;
          if (!result.ok) { status.textContent = `Input rejected: ${result.error}`; busy(false); return; }
          output.textContent = view.format(result);
          try { await (view.render as (run: unknown, result: unknown) => unknown)(pendingRun, result); } catch { /* raw output remains */ }
          status.textContent = 'Complete. Computed by the C++ engine.'; busy(false);
        };
        worker.postMessage({ type: 'load', kind });
      } catch (error) { status.textContent = error instanceof Error ? error.message : 'Invalid input'; busy(false); }
    });
  });
}
