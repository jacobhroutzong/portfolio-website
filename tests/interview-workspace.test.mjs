import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const base = new URL('../public/projects/interview-notebook/lab/', import.meta.url);
const html = await readFile(new URL('index.html', base), 'utf8');
const tracker = JSON.parse(html.match(/<script id="tracker-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const context = {window: {}};
vm.runInNewContext(await readFile(new URL('coding-problems.js', base), 'utf8'), context);
const bank = context.window.NotebookProblems;
const fields = {Coding: 'coding', 'System design': 'design', Behavioral: 'behavioral', Other: 'other'};

test('each runnable contract links to a tracker exercise and includes distinct test inputs', () => {
  assert.ok(bank.length > 0);
  assert.equal(new Set(bank.map(p => p.id)).size, bank.length);
  for (const p of bank) {
    const key = fields[p.category];
    const legacy = tracker.scenarios.find(item => item.company === p.company)?.[key];
    const titles = [
      legacy?.[0],
      ...(tracker.practiceSets[p.company]?.[key] || []).map(item => item.title),
      ...tracker.matched.filter(item => item.company === p.company && item.category === p.category).map(item => item.title),
    ];
    assert.ok(titles.includes(p.title), p.company + ' / ' + p.title);
    assert.ok(p.cases.length >= 4, p.id);
    assert.equal(new Set(p.cases.map(c => JSON.stringify(c.input))).size, p.cases.length, p.id);
    assert.ok(p.cases.every(c => Object.hasOwn(c, 'expected') && c.name), p.id);
    if (p.languages.includes('sql')) {
      assert.ok(p.cases.every(c => c.setup === context.window.NotebookSQLFixture(p, c.input)), p.id);
    }
  }
});
