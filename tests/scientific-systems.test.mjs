import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/data/scientific-systems.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const registry = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
test('Scientific Systems registry keeps seven honest project scopes', () => {
  assert.equal(registry.labProjects.length, 7);
  assert.equal(new Set(registry.labProjects.map(p => p.id)).size, 7);
  assert.equal(registry.labProjects.filter(p => p.status === 'In progress').length, 2);
  assert.equal(registry.labProjects.filter(p => p.status === 'Planning').length, 5);
  for (const project of registry.labProjects) {
    if (project.status === 'Planning') assert.deepEqual(project.implemented, []);
    if (project.sourceUrl) assert.match(project.sourceUrl, /^https:\/\/github\.com\/jacobhroutzong\//);
    assert.ok(project.limitation && project.next);
  }
});
test('Recorded native LU/solve fixture obeys its mathematical contract', () => {
  const f = JSON.parse(fs.readFileSync(new URL('../src/data/scientific-lu-fixture.json', import.meta.url), 'utf8'));
  assert.equal(f.kind, 'recorded-cpp-fixture');
  const pa = [...f.a];
  for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) {
    const pivot = f.pivots[k];
    [pa[j * 2 + k], pa[j * 2 + pivot]] = [pa[j * 2 + pivot], pa[j * 2 + k]];
  }
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    let product = 0, ax = 0;
    for (let k = 0; k < 2; k++) {
      const l = i === k ? 1 : i > k ? f.packed[k * 2 + i] : 0;
      const u = k <= j ? f.packed[j * 2 + k] : 0;
      product += l * u;
      ax += f.a[k * 2 + i] * f.x[j * 2 + k];
    }
    assert.ok(Math.abs(product - pa[j * 2 + i]) < 1e-13);
    assert.ok(Math.abs(ax - f.b[j * 2 + i]) < 1e-13);
  }
});
test('Public measurements retain dates, raw samples and validation boundaries', () => {
  const f = JSON.parse(fs.readFileSync(new URL('../public/media/scientific-systems/validation-summary.json', import.meta.url), 'utf8'));
  assert.equal(f.not_original_dll_differential, true);
  assert.equal(f.numerical.ctestEntries, registry.numericalResults.testEntries);
  assert.equal(f.symbolic.reference.total_cases, 366);
  for (const row of f.benchmark.benchmarks) {
    assert.equal(row.cpp_samples_ns.length, 7);
    assert.equal(row.numpy_samples_ns.length, 7);
    assert.equal([...row.cpp_samples_ns].sort((a,b) => a-b)[3], row.cpp_median_ns);
  }
  assert.doesNotMatch(JSON.stringify(f), /C:\\\\Users|token|secret/i);
});
