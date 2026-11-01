import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseMatrixText, reshapeMatrixText, residualMatrix, rowOrderFromPivots, parseExpression, toLatex, evaluate, freeVariables, derivativeCrossCheck, expressionAdvice, createResultGate, logPosition, treeSvg, plotSvg, sampleFunction } from '../src/lib/scientific-ui.mjs';

test('matrix parsing mirrors engine limits and names the offending cell', () => {
  assert.deepEqual(parseMatrixText('1 2\n3 4', 2, 2).values, [1, 2, 3, 4]);
  assert.deepEqual(parseMatrixText('1, 2\n3,4', 2, 2).values, [1, 2, 3, 4]);
  const bad = parseMatrixText('1 NaN\n3 4', 2, 2);
  assert.equal(bad.values, null);
  assert.match(bad.problems[0].message, /Row 1, column 2.*decimal numbers only/);
  assert.match(parseMatrixText('1 2\n3', 2, 2).problems[0].message, /Row 2 needs 2 entries/);
  assert.match(parseMatrixText('1 2', 2, 2).problems[0].message, /needs 2 rows/);
  assert.match(parseMatrixText('1e101 0\n0 1', 2, 2).problems[0].message, /1e100/);
  assert.ok(parseMatrixText('1e100 0\n0 -1e100', 2, 2).values);
});

test('reshaping keeps entries and pads A with an identity diagonal', () => {
  assert.equal(reshapeMatrixText('1 2\n3 4', 3, 3, true), '1 2 0\n3 4 0\n0 0 1');
  assert.equal(reshapeMatrixText('5 5\n11 9', 1, 1, false), '5');
  assert.equal(reshapeMatrixText('5 5\n11 9', 2, 3, false), '5 5 0\n11 9 0');
});

test('residual of the recorded native LU fixture is tiny and pivot order matches', () => {
  const f = JSON.parse(fs.readFileSync(new URL('../src/data/scientific-lu-fixture.json', import.meta.url), 'utf8'));
  // fixture arrays are column-major 2x2
  const a = [f.a[0], f.a[2], f.a[1], f.a[3]];
  const x = [[f.x[0], f.x[2]], [f.x[1], f.x[3]]];
  const r = residualMatrix(a, x, [5, 5, 11, 9], 2, 2);
  assert.ok(r.flat().every(v => Math.abs(v) < 1e-12));
  assert.deepEqual(rowOrderFromPivots(f.pivots), [1, 0]);
  assert.deepEqual(rowOrderFromPivots([2, 2, 2]), [2, 0, 1]); // swap 0<->2 gives [2,1,0]; swap 1<->2 gives [2,0,1]; last is a no-op
});

test('log gauge places machine precision between the ends', () => {
  assert.equal(logPosition(1), 1);
  assert.equal(logPosition(0), 0);
  assert.ok(Math.abs(logPosition(1e-9) - 0.5) < 1e-12);
});

test('engine output strings parse to the stated structure', () => {
  const fixtures = JSON.parse(fs.readFileSync(new URL('../src/data/scientific-symbolic-fixtures.json', import.meta.url), 'utf8'));
  for (const fx of fixtures) {
    const tree = parseExpression(fx.canonical);
    const d = parseExpression(fx.derivative);
    assert.deepEqual([...freeVariables(tree)].filter(v => v !== 'x'), []);
    // A central difference of the canonical form agrees with the recorded native derivative.
    const check = derivativeCrossCheck(tree, d, 'x', -3, 3);
    assert.ok(check.used > 50, fx.input);
    assert.ok(check.worst < 1e-5, `${fx.input}: ${check.worst}`);
  }
  const t = parseExpression('((3*((x+1)^2))+2)');
  assert.equal(t.op, '+'); assert.equal(t.a.op, '*');
  assert.equal(evaluate(t, { x: 1 }), 14);
  assert.equal(evaluate(parseExpression('(1/x)'), { x: 0 }), NaN);
  assert.ok(Number.isNaN(evaluate(parseExpression('(x^0)'), { x: 0 })));
  assert.equal(evaluate(parseExpression('((-1)/(x^2))'), { x: 2 }), -0.25);
});

test('typesetting inserts only required parentheses', () => {
  assert.equal(toLatex(parseExpression('((a+b)*c)')), '\\left(a+b\\right)\\cdot c');
  assert.equal(toLatex(parseExpression('(a+(b*c))')), 'a+b\\cdot c');
  assert.equal(toLatex(parseExpression('((-1)/(x^2))')), '\\frac{-1}{x^{2}}');
  assert.equal(toLatex(parseExpression('(a-(b-c))')), 'a-\\left(b-c\\right)');
  assert.equal(toLatex(parseExpression('((x+1)^3)')), '\\left(x+1\\right)^{3}');
  assert.throws(() => parseExpression('(x+'));
  assert.throws(() => parseExpression('x $ 2'));
});

test('advisory input checks flag unsupported syntax without blocking valid input', () => {
  assert.deepEqual(expressionAdvice('x^3 + 2*x', 'x'), []);
  assert.ok(expressionAdvice('sin(x)', 'x').some(n => /Function calls/.test(n.message)));
  assert.ok(expressionAdvice('2x', 'x').some(n => /multiplication/.test(n.message)));
  assert.ok(expressionAdvice('x^x', 'x').some(n => /exponent/.test(n.message)));
  assert.ok(expressionAdvice('(x+1', 'x').some(n => n.level === 'error'));
  assert.ok(expressionAdvice('x', '1x').some(n => n.level === 'error'));
});

test('drawings are produced from real data and degrade to null', () => {
  assert.match(treeSvg(parseExpression('((x+1)*2)'), 'tree'), /<svg[^>]*role="img"/);
  const s = sampleFunction(parseExpression('(x^2)'), 'x', -2, 2, 40);
  assert.match(plotSvg([{ name: 'f', points: s }], -2, 2), /<path class="series s0"/);
  assert.equal(plotSvg([{ name: 'f', points: [[0, NaN]] }], -1, 1), null);
});

test('result gate invalidates every earlier token and only the newest run is current', () => {
  const gate = createResultGate();
  const first = gate.token();
  assert.ok(gate.isCurrent(first));
  gate.invalidate();
  assert.equal(gate.isCurrent(first), false);
  const second = gate.token();
  assert.ok(gate.isCurrent(second));
  gate.invalidate(); gate.invalidate();
  assert.equal(gate.isCurrent(second), false);
  assert.equal(gate.isCurrent(gate.token()), true);
});
