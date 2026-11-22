import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async name => JSON.parse(await readFile(new URL(`../public/study/${name}/data.json`, import.meta.url), 'utf8'));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function sourceRegistry(data) {
  const ids = new Set();
  for (const source of data.sources) {
    assert.ok(nonempty(source.id) && !ids.has(source.id), 'source IDs must be unique');
    ids.add(source.id);
    assert.ok(nonempty(source.title));
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname.endsWith('.mil'), `expected official source: ${source.url}`);
  }
  return ids;
}

function citations(item, sources) {
  assert.ok(item.sourceIds.length > 0, `missing citation: ${item.id}`);
  for (const id of item.sourceIds) assert.ok(sources.has(id), `unknown source: ${id}`);
}

test('acronym recall uses unique, sourced terms and keeps unresolved terminology out of practice', async () => {
  const data = await read('acronyms');
  const sources = sourceRegistry(data);
  assert.equal(new Set(data.entries.map(entry => entry.id)).size, data.entries.length);
  for (const entry of data.entries) {
    for (const field of ['id', 'term', 'expansion', 'category', 'meaning']) assert.ok(nonempty(entry[field]), `${entry.id}: ${field}`);
    citations(entry, sources);
    for (const component of entry.components ?? []) assert.ok(nonempty(component.letter) && nonempty(component.meaning));
  }
  assert.ok(!data.entries.some(entry => /^(DART|SPORTS)$/i.test(entry.term) && entry.study !== false));
  for (const term of ['DART', 'SPORTS']) assert.ok(data.notices.some(notice => notice.term === term));
  assert.match(data.entries.find(entry => entry.id === 'five-cs').prompt, /ATP 4-32\.2/);
  const medevac = data.entries.find(entry => entry.id === 'nine-line-medevac');
  assert.equal(medevac.components.length, 9);
  for (const number of ['6', '9']) {
    const field = medevac.components.find(component => component.letter === number);
    assert.match(field.meaning, /wartime/);
    assert.match(field.meaning, /peacetime/);
  }
  assert.equal(data.entries.find(entry => entry.id === 'tlps').components.length, 8);
});

test('EW lessons have stable question identities, complete answers, and traceable publication editions', async () => {
  const data = await read('ew');
  const sources = sourceRegistry(data);
  assert.equal(new Set(data.lessons.map(lesson => lesson.id)).size, data.lessons.length);
  for (const lesson of data.lessons) {
    citations(lesson, sources);
    assert.ok(nonempty(lesson.title) && nonempty(lesson.summary));
    assert.ok(lesson.sections.length > 0 && lesson.questions.length > 0);
    assert.equal(new Set(lesson.questions.map(question => question.id)).size, lesson.questions.length);
    for (const question of lesson.questions) {
      assert.ok(nonempty(question.id) && nonempty(question.prompt) && nonempty(question.answer));
    }
  }
  assert.equal(new Set(data.publications.map(publication => publication.id)).size, data.publications.length);
  for (const publication of data.publications) {
    assert.ok(sources.has(publication.id));
    for (const field of ['code', 'title', 'edition', 'access', 'note']) assert.ok(nonempty(publication[field]), `${publication.id}: ${field}`);
  }
});
