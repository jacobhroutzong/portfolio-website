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

test('each company offers practice in four categories and cited external problems', () => {
  const titles = new Set();
  for (const company of tracker.roster) {
    const legacy = tracker.scenarios.find(item => item.company === company);
    for (const key of Object.values(fields)) {
      const drills = tracker.practiceSets[company][key];
      assert.ok(drills.length + (legacy?.[key] ? 1 : 0) >= 3, company + '/' + key);
      assert.ok(drills.some(drill => drill.context?.label && new URL(drill.context.url).protocol === 'https:'), company + '/' + key);
      const names = drills.map(drill => drill.title);
      if (legacy?.[key]) names.push(legacy[key][0]);
      for (const title of names) {
        assert.ok(!titles.has(title), title);
        titles.add(title);
      }
    }
    const problems = tracker.communityResources.companies[company].problems;
    assert.ok(problems.length >= 6, company);
    assert.equal(new Set(problems.map(problem => problem.url)).size, problems.length, company);
    for (const problem of problems) {
      assert.ok(problem.title && problem.sourceLabel);
      assert.equal(new URL(problem.url).protocol, 'https:');
      assert.equal(new URL(problem.sourceUrl).protocol, 'https:');
    }
  }
  for (const sample of tracker.matched) {
    assert.ok(!titles.has(sample.title), sample.title);
    titles.add(sample.title);
    assert.ok(tracker.sources.some(source => source.kind === 'named' && source.company === sample.company &&
      source.category === sample.category && source.sourceLabel === sample.sourceLabel));
  }
});
