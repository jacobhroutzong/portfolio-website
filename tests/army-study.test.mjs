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
  const data = await read('17e/acronyms');
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
    assert.ok(lesson.objectives.length > 0 && nonempty(lesson.sourceLocator), `missing learning context: ${lesson.id}`);
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

test('every manual chapter and appendix has a traceable coverage disposition', async () => {
  const data = await read('ew');
  const sources = sourceRegistry(data);
  const lessons = new Map(data.lessons.map(lesson => [lesson.id, lesson]));
  const courseIds = new Set(data.courses.map(course => course.id));
  assert.equal(courseIds.size, data.courses.length);
  const expectedUnits = { fm312: 14, atp3123: 10, atp3124: 5, jp385: 13, atp60270: 8, atp30181: 8, atp71001: 18, atp71003: 16 };
  const unitIds = new Set();
  const mappedLessons = new Set();
  for (const course of data.courses) {
    const ownLessons = data.lessons.filter(lesson => lesson.courseId === course.id);
    assert.ok(ownLessons.length > 0, `empty course: ${course.id}`);
    if (course.kind === 'orientation') continue;
    assert.ok(sources.has(course.sourceId), `unknown reading source: ${course.id}`);
    assert.ok(nonempty(course.verifiedEdition));
    assert.equal(course.units.length, expectedUnits[course.id], `TOC inventory changed: ${course.id}`);
    assert.ok(['verified-edition', 'prior-edition', 'catalog-only'].includes(course.sourceStatus));
    if (course.sourceStatus !== 'verified-edition') assert.ok(nonempty(course.note), `missing edition limitation: ${course.id}`);
    for (const unit of course.units) {
      assert.ok(!unitIds.has(unit.id), `duplicate unit: ${unit.id}`);
      unitIds.add(unit.id);
      assert.ok(nonempty(unit.locator) && nonempty(unit.title));
      assert.ok(unit.topics.length > 0 && unit.topics.every(nonempty));
      assert.ok(['lesson', 'guided-reading', 'unverified'].includes(unit.status));
      if (unit.status !== 'lesson') assert.ok(nonempty(unit.note), `missing scope note: ${unit.id}`);
      assert.ok(unit.lessonIds.length > 0 || nonempty(unit.readingObjective), `unexplained coverage gap: ${unit.id}`);
      for (const id of unit.lessonIds) {
        assert.equal(lessons.get(id)?.courseId, course.id, `cross-course or missing lesson: ${unit.id} -> ${id}`);
        mappedLessons.add(id);
      }
    }
  }
  for (const lesson of data.lessons) {
    assert.ok(courseIds.has(lesson.courseId), `unknown course: ${lesson.id}`);
    if (lesson.courseId !== 'orientation') assert.ok(mappedLessons.has(lesson.id), `lesson absent from coverage map: ${lesson.id}`);
  }
  assert.equal(Object.keys(expectedUnits).length, data.courses.filter(course => course.kind !== 'orientation').length);
});

test('AGSU study keeps placement questions and removes general definition cards', async () => {
  const data = JSON.parse(await readFile(new URL('../public/study/17e/cards.json', import.meta.url), 'utf8'));
  assert.equal(data.cards.filter(card => card.viTrack === true).length, 117);
  const placements = data.cards.filter(card => card.id.startsWith('agsu-measure-'));
  assert.equal(placements.length, 16);
  for (const card of placements) assert.match(card.q, /^(Where|How far|How are|In which direction)/);
  for (const id of ['extra42', 'extra43', 'phasevi-focus-08']) assert.ok(!data.cards.some(card => card.id === id));
});

test('Soldier Study maps every lesson objective and preserves source provenance', async () => {
  const data = await read('soldier');
  const sources = sourceRegistry(data);
  const courses = new Map(data.courses.map(course => [course.id, course]));
  assert.deepEqual([...courses.keys()], ['foundations', 'small-units', 'field-health', 'casualty-response']);
  assert.equal(courses.size, data.courses.length);
  const lessons = new Map(data.lessons.map(lesson => [lesson.id, lesson]));
  assert.equal(lessons.size, data.lessons.length);
  const units = data.courses.flatMap(course => course.units);
  assert.equal(new Set(units.map(unit => unit.id)).size, units.length);
  const dispositions = new Set(['taught', 'partial', 'assigned-reading', 'practical', 'excluded', 'unverified']);
  assert.deepEqual(new Set(units.map(unit => unit.status)), dispositions);

  for (const course of courses.values()) {
    for (const unit of course.units) {
      citations(unit, sources);
      assert.ok(nonempty(unit.title) && nonempty(unit.locator) && nonempty(unit.note), unit.id);
      if (unit.status === 'assigned-reading') assert.ok(nonempty(unit.readingObjective), unit.id);
      for (const id of unit.lessonIds ?? []) assert.equal(lessons.get(id)?.courseId, course.id, id);
      if (unit.status === 'taught') {
        assert.ok(unit.lessonIds?.length && unit.lessonIds.some(id => lessons.get(id)?.objectives.includes(unit.title)), unit.id);
      }
    }
  }

  for (const lesson of lessons.values()) {
    const course = courses.get(lesson.courseId);
    assert.ok(course, lesson.id);
    citations(lesson, sources);
    assert.ok(nonempty(lesson.sourceLocator) && lesson.sections.every(section => nonempty(section.heading) && nonempty(section.text)), lesson.id);
    for (const objective of lesson.objectives) {
      assert.ok(course.units.some(unit => unit.status === 'taught' && unit.title === objective && unit.lessonIds.includes(lesson.id)), lesson.id);
    }
    assert.ok(lesson.questions.length > 0);
    assert.equal(new Set(lesson.questions.map(question => question.id)).size, lesson.questions.length);
    for (const question of lesson.questions) {
      assert.ok(nonempty(question.id) && nonempty(question.prompt) && nonempty(question.answer), lesson.id);
    }
  }
  assert.match(data.publications.find(entry => entry.id === 'atp-casualty').readingNote, /Third-party/);
  for (const sourceId of ['stp-common', 'tc-landnav']) {
    assert.match(data.publications.find(entry => entry.id === sourceId).access, /requires Army authentication/);
    assert.ok(units.some(unit => unit.status === 'unverified' && unit.sourceIds.includes(sourceId)));
  }
  assert.match(lessons.get('casualty-card-and-mist').questions[0].answer, /mechanism.*injuries.*signs and symptoms.*treatments/);
});
