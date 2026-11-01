// Presentation helpers for the Scientific Systems Lab workbenches.
// Nothing here computes a result the C++ engines own. These functions parse user input for
// validation feedback, and read/format/draw the engines' own output strings and numbers.

const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/** Parse a whitespace/comma separated matrix. Returns row-major values and cell-level problems. */
export function parseMatrixText(text, rows, columns, label = 'Matrix') {
  const lines = String(text).replace(/\s+$/, '').split(/\r?\n/);
  const cells = [];
  const problems = [];
  if (lines.length !== rows) problems.push({ row: null, column: null, message: `${label} needs ${rows} row${rows === 1 ? '' : 's'}; found ${lines.length}.` });
  lines.forEach((line, r) => {
    const tokens = line.trim() === '' ? [] : line.trim().split(/[\s,]+/);
    if (tokens.length !== columns) problems.push({ row: r, column: null, message: `Row ${r + 1} needs ${columns} entr${columns === 1 ? 'y' : 'ies'}; found ${tokens.length}.` });
    cells.push(tokens.map((token, c) => {
      if (!DECIMAL.test(token)) {
        problems.push({ row: r, column: c, message: `Row ${r + 1}, column ${c + 1}: “${token.slice(0, 12)}” is not valid. Use decimal numbers only.` });
        return { text: token, value: NaN, ok: false };
      }
      const value = Number(token);
      if (!Number.isFinite(value) || Math.abs(value) > 1e100) {
        problems.push({ row: r, column: c, message: `Row ${r + 1}, column ${c + 1}: entries must be finite with magnitude at most 1e100.` });
        return { text: token, value, ok: false };
      }
      return { text: token, value, ok: true };
    }));
  });
  const values = problems.length ? null : cells.flat().map(cell => cell.value);
  return { cells, problems, values };
}

/** Reshape matrix text to a new size, keeping existing entries. Padding keeps A solvable-looking (identity diagonal). */
export function reshapeMatrixText(text, rows, columns, identityPad) {
  const old = String(text).trim().split(/\r?\n/).map(line => line.trim().split(/[\s,]+/).filter(Boolean));
  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < columns; c++) row.push(old[r]?.[c] ?? (identityPad && r === c ? '1' : '0'));
    out.push(row.join(' '));
  }
  return out.join('\n');
}

/** R = A·X − B in binary64, row-major arrays. Display-only cross-check of the engine's X. */
export function residualMatrix(a, x, b, n, r) {
  const residual = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < r; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += a[i * n + k] * x[k][j];
      row.push(sum - b[i * r + j]);
    }
    residual.push(row);
  }
  return residual;
}

/** Original row index sitting in each position after applying the engine's sequential pivot swaps. */
export function rowOrderFromPivots(pivots) {
  const order = pivots.map((_, i) => i);
  pivots.forEach((p, k) => { [order[k], order[p]] = [order[p], order[k]]; });
  return order;
}

/** A 1, 2 or 5 times power-of-ten step giving about `target` intervals. */
export function niceStep(range, target) {
  const raw = range / target, pow = 10 ** Math.floor(Math.log10(raw)), f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

export function formatNumber(value) {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-4) {
    const [m, e] = value.toExponential(3).split('e');
    const sup = String(Number(e)).replace(/-/g, '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
    return `${m} × 10${sup}`;
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(6)));
}

/** Position 0..1 of a positive value on a log10 axis from 1e-18 to 1. */
export function logPosition(value, low = -18, high = 0) {
  if (!(value > 0)) return 0;
  return Math.min(1, Math.max(0, (Math.log10(value) - low) / (high - low)));
}

// ----- Symbolic output strings: parse, typeset, evaluate -----

const TOKEN = /\s*(\d+|[A-Za-z_][A-Za-z_0-9]*|[-+*/^()])/y;
function tokenize(source) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  let match;
  while (TOKEN.lastIndex < source.length && (match = TOKEN.exec(source))) tokens.push(match[1]);
  if (TOKEN.lastIndex < source.replace(/\s+$/, '').length) throw new Error('Unrecognized character in expression.');
  return tokens;
}

/** Parse the engine's printed expression (explicit operators, integers, identifiers, parentheses). */
export function parseExpression(source) {
  const tokens = tokenize(source);
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];
  function primary() {
    const t = take();
    if (t === undefined) throw new Error('Unexpected end of expression.');
    if (t === '(') { const inner = sum(); if (take() !== ')') throw new Error('Missing closing parenthesis.'); return inner; }
    if (/^\d+$/.test(t)) return { op: 'num', value: t };
    if (/^[A-Za-z_]/.test(t)) return { op: 'var', name: t };
    throw new Error(`Unexpected “${t}”.`);
  }
  function unary() { if (peek() === '-') { take(); return { op: 'neg', a: unary() }; } if (peek() === '+') { take(); return unary(); } return power(); }
  function power() { const base = primary(); if (peek() === '^') { take(); return { op: '^', a: base, b: unary() }; } return base; }
  function product() { let left = unary(); while (peek() === '*' || peek() === '/') left = { op: take(), a: left, b: unary() }; return left; }
  function sum() { let left = product(); while (peek() === '+' || peek() === '-') left = { op: take(), a: left, b: product() }; return left; }
  const tree = sum();
  if (i !== tokens.length) throw new Error('Unexpected trailing input.');
  return tree;
}

const prec = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4, num: 5, var: 5 };
/** LaTeX for KaTeX, inserting parentheses only where precedence requires them. */
export function toLatex(node, parentPrec = 0, side = 'left') {
  const p = prec[node.op];
  let out;
  switch (node.op) {
    case 'num': out = node.value; break;
    case 'var': out = node.name.length === 1 ? node.name : `\\mathrm{${node.name.replace(/_/g, '\\_')}}`; break;
    case 'neg': out = `-${toLatex(node.a, p, 'right')}`; break;
    case '+': out = `${toLatex(node.a, p)}+${toLatex(node.b, p, 'right')}`; break;
    case '-': out = `${toLatex(node.a, p)}-${toLatex(node.b, p + 1, 'right')}`; break;
    case '*': out = `${toLatex(node.a, p)}\\cdot ${toLatex(node.b, p + 1, 'right')}`; break;
    case '/': return `\\frac{${toLatex(node.a)}}{${toLatex(node.b)}}`;
    case '^': out = `${toLatex(node.a, p + 1)}^{${toLatex(node.b)}}`; break;
    default: throw new Error('Unknown node');
  }
  const needs = p < parentPrec || (node.op === 'neg' && side === 'right' && parentPrec > 0);
  return needs ? `\\left(${out}\\right)` : out;
}

export function freeVariables(node, found = new Set()) {
  if (node.op === 'var') found.add(node.name);
  else if (node.op !== 'num') { freeVariables(node.a, found); if (node.b) freeVariables(node.b, found); }
  return found;
}

/** Evaluate in binary64. Division by zero and non-finite powers give NaN. */
export function evaluate(node, env) {
  switch (node.op) {
    case 'num': return Number(node.value);
    case 'var': return env[node.name] ?? NaN;
    case 'neg': return -evaluate(node.a, env);
    case '+': return evaluate(node.a, env) + evaluate(node.b, env);
    case '-': return evaluate(node.a, env) - evaluate(node.b, env);
    case '*': return evaluate(node.a, env) * evaluate(node.b, env);
    case '/': { const d = evaluate(node.b, env); return d === 0 ? NaN : evaluate(node.a, env) / d; }
    case '^': { const a = evaluate(node.a, env), b = evaluate(node.b, env); if (a === 0 && b <= 0) return NaN; const v = a ** b; return Number.isFinite(v) ? v : NaN; }
    default: return NaN;
  }
}

/** Samples of a one-variable tree over [min, max]. */
export function sampleFunction(node, variable, min, max, count = 240) {
  const points = [];
  for (let i = 0; i <= count; i++) { const x = min + ((max - min) * i) / count; points.push([x, evaluate(node, { [variable]: x })]); }
  return points;
}

/** Largest gap between a central difference of f and the engine's derivative, on well-behaved samples. */
export function derivativeCrossCheck(f, df, variable, min, max, count = 120) {
  let worst = 0, used = 0;
  const h = 1e-5;
  for (let i = 1; i < count; i++) {
    const x = min + ((max - min) * i) / count;
    const a = evaluate(f, { [variable]: x - h }), b = evaluate(f, { [variable]: x + h }), d = evaluate(df, { [variable]: x });
    if (![a, b, d].every(Number.isFinite) || Math.abs(d) > 1e4) continue;
    const scale = Math.max(1, Math.abs(d));
    worst = Math.max(worst, Math.abs((b - a) / (2 * h) - d) / scale);
    used++;
  }
  return { worst, used };
}

/** Advisory checks mirroring the documented browser limits. The engine remains the authority. */
export function expressionAdvice(text, variable) {
  const notes = [];
  if (text.length > 256) notes.push({ level: 'error', message: 'Longer than the 256-character limit.' });
  if (/[^\x20-\x7e]/.test(text)) notes.push({ level: 'error', message: 'Use plain ASCII characters only.' });
  if (!/^[A-Za-z_][A-Za-z_0-9]{0,31}$/.test(variable)) notes.push({ level: 'error', message: 'Variable name must start with a letter or underscore (up to 32 characters).' });
  if (/[A-Za-z_][A-Za-z_0-9]*\s*\(/.test(text)) notes.push({ level: 'warn', message: 'Function calls such as sin(x) are not supported.' });
  if (/\d\s*[A-Za-z_(]|\)\s*[A-Za-z_\d(]/.test(text)) notes.push({ level: 'warn', message: 'Write multiplication explicitly: 2*x, not 2x.' });
  if (/\^\s*\(?\s*[A-Za-z_]/.test(text)) notes.push({ level: 'warn', message: 'Variable exponents such as x^n are not supported; use integer powers from −16 to 16.' });
  if (/\d\.\d|\./.test(text)) notes.push({ level: 'warn', message: 'Only integer literals are accepted; use fractions like 1/2.' });
  const depth = [...text].reduce((d, ch) => ch === '(' ? [d[0] + 1, Math.max(d[1], d[0] + 1)] : ch === ')' ? [d[0] - 1, d[1]] : d, [0, 0]);
  if (depth[0] !== 0) notes.push({ level: 'error', message: 'Parentheses are unbalanced.' });
  return notes;
}

// ----- SVG drawing (string output, theme via CSS classes) -----

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const label = node => node.op === 'num' ? node.value : node.op === 'var' ? node.name : node.op === 'neg' ? '−' : node.op === '*' ? '×' : node.op === '-' ? '−' : node.op;

/** Tree diagram of an expression exactly as parsed from the engine's printed output. */
export function treeSvg(root, title) {
  const unit = 44, levelHeight = 58;
  let nextLeaf = 0, maxDepth = 0;
  function layout(node, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const kids = node.op === 'num' || node.op === 'var' ? [] : node.b ? [node.a, node.b] : [node.a];
    const placed = kids.map(k => layout(k, depth + 1));
    const x = placed.length ? (placed[0].x + placed[placed.length - 1].x) / 2 : nextLeaf++ * unit;
    return { node, x, depth, kids: placed };
  }
  const laid = layout(root, 0);
  const width = Math.max(nextLeaf, 1) * unit + 40, height = (maxDepth + 1) * levelHeight + 20;
  let lines = '', nodes = '';
  (function draw(p) {
    for (const k of p.kids) { lines += `<line x1="${p.x + 20}" y1="${p.depth * levelHeight + 30}" x2="${k.x + 20}" y2="${k.depth * levelHeight + 14}"/>`; draw(k); }
    const leaf = p.kids.length === 0;
    nodes += `<g class="${leaf ? 'leaf' : 'op'}"><circle cx="${p.x + 20}" cy="${p.depth * levelHeight + 22}" r="${leaf ? 15 : 14}"/><text x="${p.x + 20}" y="${p.depth * levelHeight + 27}" text-anchor="middle">${esc(label(p.node))}</text></g>`;
  })(laid);
  return `<svg class="lab-tree" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" width="${width}" height="${height}"><g class="edges">${lines}</g>${nodes}</svg>`;
}

/** Line plot of f and f' with gaps at undefined points. */
export function plotSvg(series, min, max) {
  const W = 640, H = 300, L = 44, R = 14, T = 14, B = 30;
  const finite = series.flatMap(s => s.points.map(p => p[1]).filter(Number.isFinite)).sort((a, b) => a - b);
  if (!finite.length) return null;
  // Trim extreme values only when the curve has asymptote-like spikes; otherwise show the full range.
  const fullLo = finite[0], fullHi = finite[finite.length - 1];
  const trimLo = finite[Math.floor(finite.length * 0.03)], trimHi = finite[Math.ceil(finite.length * 0.97) - 1];
  const spiky = fullHi - fullLo > 12 * Math.max(trimHi - trimLo, 1e-12);
  const lo = spiky ? trimLo : fullLo, hi = spiky ? trimHi : fullHi;
  let yMin = Math.min(lo, 0), yMax = Math.max(hi, 0);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const step = niceStep(yMax - yMin, 4);
  yMin = Math.floor(yMin / step) * step; yMax = Math.ceil(yMax / step) * step;
  const X = x => L + ((x - min) / (max - min)) * (W - L - R), Y = y => T + (1 - (y - yMin) / (yMax - yMin)) * (H - T - B);
  const yTicks = []; for (let t = yMin; t <= yMax + step / 1e6; t += step) yTicks.push(Number(t.toPrecision(12)));
  const xStep = niceStep(max - min, 5), xTicks = []; for (let t = Math.ceil(min / xStep) * xStep; t <= max + xStep / 1e6; t += xStep) xTicks.push(Number(t.toPrecision(12)));
  let grid = '';
  for (const t of xTicks) grid += `<line class="grid" x1="${X(t)}" x2="${X(t)}" y1="${T}" y2="${H - B}"/><text x="${X(t)}" y="${H - 10}" text-anchor="middle">${esc(formatNumber(t))}</text>`;
  for (const t of yTicks) grid += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end">${esc(formatNumber(t))}</text>`;
  const axes = (yMin < 0 && yMax > 0 ? `<line class="axis" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/>` : '') + (min < 0 && max > 0 ? `<line class="axis" x1="${X(0)}" x2="${X(0)}" y1="${T}" y2="${H - B}"/>` : '');
  const paths = series.map((s, idx) => {
    let d = '', pen = false, prev = null;
    for (const [x, y] of s.points) {
      const visible = Number.isFinite(y) && y >= yMin - (yMax - yMin) && y <= yMax + (yMax - yMin);
      if (!visible || (prev !== null && Math.abs(y - prev) > (yMax - yMin) * 1.5)) { pen = false; prev = visible ? y : null; if (!visible) continue; }
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)} ${Math.max(T - 4, Math.min(H - B + 4, Y(y))).toFixed(1)}`; pen = true; prev = y;
    }
    return `<path class="series s${idx}" d="${d}"/>`;
  }).join('');
  return `<svg class="lab-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map(s => s.name).join(' and '))} plotted from ${min} to ${max}">${grid}${axes}${paths}</svg>`;
}

/**
 * Guards displayed results against stale inputs. Each run captures a token; any edit invalidates every
 * earlier token, so a result computed from old inputs can never be presented as current.
 */
export function createResultGate() {
  let generation = 0;
  return { token: () => generation, invalidate: () => { generation += 1; }, isCurrent: token => token === generation };
}
