// Native executable paths are arguments, never persisted machine-specific settings.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [directory, solveProbe, symbolicCli] = process.argv.slice(2);
if (!symbolicCli) throw new Error('Usage: node wasm-parity.mjs WASM_DIRECTORY SOLVE_PROBE SYMBOLIC_CLI');
const load = async name => (await import(pathToFileURL(resolve(directory, `${name}.mjs`)))).default();
const numerical = await load('numerical'), symbolic = await load('symbolic');
const native = (executable, input) => {
  const result = spawnSync(executable, [], { input, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim().split(/\r?\n/);
};
let state = 0x12345678;
const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state / 2**32) * 2 - 1; };
let matrices = 0;
for (let n = 1; n <= 16; n++) for (const r of [1, 4]) {
  const a = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => random() + (i === j ? n : 0)));
  const b = Array.from({ length: n }, () => Array.from({ length: r }, random));
  const wire = [n, r, ...a.flat(), ...b.flat()].join(' ');
  const original = [n, r, ...Array.from({ length: n }, (_, j) => a.map(row => row[j])).flat(), ...Array.from({ length: r }, (_, j) => b.map(row => row[j])).flat()].join(' ') + '\n';
  const reference = JSON.parse(native(solveProbe, original)[0]);
  const result = JSON.parse(numerical.solve(wire)); assert.equal(result.ok, true);
  for (let i = 0; i < n; i++) for (let j = 0; j < r; j++) assert.ok(Math.abs(result.x[i][j] - reference.x[j*n+i]) <= 1e-13 * Math.max(1, Math.abs(reference.x[j*n+i])));
  assert.ok(result.backwardError < 1e-14); matrices++;
}
for (const wire of ['2 1 1 2 2 4 3 6', '17 1', '1 1 nan 1', '1 1 1 1 extra', '0 1']) assert.equal(JSON.parse(numerical.solve(wire)).ok, false);
const expressions = ['x^3+2*x', 'x^0', 'x/x', '0*(1/x)', 'x^-2', '(x+1)^4', '(x+2)/(x-3)', 'x^1', '7/3', 'y*x+x'];
const reference = native(symbolicCli, expressions.map(e => `derive\t${e}\tx`).join('\n')+'\n');
for (let i = 0; i < expressions.length; i++) {
  const actual = JSON.parse(symbolic.differentiate(expressions[i], 'x'));
  const [ok, , derivative, conditions] = reference[i].split('\t');
  assert.equal(ok, 'ok'); assert.equal(actual.ok, true); assert.equal(actual.derivative, derivative);
  assert.deepEqual(actual.conditions, conditions ? conditions.split(';') : []);
}
for (const e of ['x^x', '1/0', 'x^17', '9'.repeat(65), 'x+'.repeat(128)+'x', '((((9999999999999999^16)^16)^16)^16)']) assert.equal(JSON.parse(symbolic.differentiate(e,'x')).ok,false);
assert.deepEqual(JSON.parse(symbolic.differentiate('x^0','x')).conditions,['x']);
console.log(JSON.stringify({matrixNativeParityCases:matrices,symbolicNativeParityCases:expressions.length,numericalRejections:5,symbolicRejections:6,originalDllCompared:false}));
