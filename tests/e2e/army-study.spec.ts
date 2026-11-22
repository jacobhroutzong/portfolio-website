import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const curriculum = JSON.parse(readFileSync(new URL('../../public/study/ew/data.json', import.meta.url), 'utf8'));
const totalLessons = curriculum.lessons.length;
const totalQuestions = curriculum.lessons.reduce((total: number, lesson: { questions: unknown[] }) => total + lesson.questions.length, 0);

const phaseKey = 'phaseup17e.progress.v1';
const acronymKey = 'army-acronyms.progress.v1';
const ewKey = 'ew-study.progress.v1';
const sentinel = '{"preserve":"existing study progress"}';

test('study navigation and acronym recall preserve separate saved progress', async ({ page }) => {
  await page.goto('/study/');
  await page.evaluate(({ phaseKey, ewKey, sentinel }) => {
    localStorage.setItem(phaseKey, sentinel);
    localStorage.setItem(ewKey, sentinel);
  }, { phaseKey, ewKey, sentinel });
  const nav = page.getByRole('navigation', { name: 'Study tools' });
  await expect(nav.getByRole('link')).toHaveText(['Study home', 'EW Study', 'Soldier Study', 'PhaseUp 17E']);
  await expect(page.locator('article.destination h3 a')).toHaveText(['EW Study', 'Soldier Study', 'PhaseUp 17E']);
  await nav.getByRole('link', { name: 'PhaseUp 17E', exact: true }).click();
  await expect(page).toHaveURL(/\/study\/17e\/$/);
  await expect(page.locator('.study-areas').getByRole('link', { name: 'Army Acronyms', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Study Army acronyms' }).click();
  await expect(page).toHaveURL(/\/study\/17e\/acronyms\//);
  await expect(page.locator('#study-content')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), acronymKey)).toBeNull();

  await page.getByLabel('Search the reference').fill('MARCH');
  await page.getByLabel('Category', { exact: true }).selectOption('Casualty care');
  await expect(page.locator('#reference-results details')).toHaveCount(1);
  await page.locator('#reference-results summary').click();
  await expect(page.locator('#reference-results')).toContainText('Hypothermia/Head injury');
  await expect(page.locator('#reference-results a').first()).toHaveAttribute('href', /^https:\/\/.+\.mil\//);
  await page.getByLabel('Search the reference').fill('DART');
  await page.getByLabel('Category', { exact: true }).selectOption('');
  await expect(page.locator('#reference-results details')).toHaveCount(0);
  await expect(page.locator('#reference-notices')).toContainText('DART');

  for (let attempts = 0; attempts < 36 && !(await page.locator('#card-prompt').innerText()).includes('nine-line MEDEVAC'); attempts++) {
    await page.getByRole('button', { name: 'Skip card', exact: true }).click();
  }
  await expect(page.locator('#card-prompt')).toContainText('nine-line MEDEVAC');
  await expect(page.locator('#card-answer')).toBeEmpty();
  await expect(page.locator('#card-ratings')).toBeHidden();
  await page.locator('#reveal-answer').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#card-answer')).toContainText('peacetime');
  await expect(page.locator('#card-answer > ul > li')).toHaveCount(9);
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await page.getByLabel('Practice cards').selectOption('review');
  await expect(page.locator('#practice-summary')).toContainText('1 card');
  await expect(page.locator('#card-answer')).toBeEmpty();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await expect(page.locator('#card-empty')).toContainText('No cards are marked for review');
  await page.reload();
  await expect(page.locator('#practice-summary')).toContainText('1 rated Got it');
  expect(await page.evaluate(key => localStorage.getItem(key), phaseKey)).toBe(sentinel);
  expect(await page.evaluate(key => localStorage.getItem(key), ewKey)).toBe(sentinel);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('EW lessons, recall scopes, publications and reset remain independent from other study areas', async ({ page }) => {
  await page.goto('/study/');
  await page.evaluate(({ phaseKey, acronymKey, sentinel }) => {
    localStorage.setItem(phaseKey, sentinel);
    localStorage.setItem(acronymKey, sentinel);
  }, { phaseKey, acronymKey, sentinel });
  await page.getByRole('navigation', { name: 'Study tools' }).getByRole('link', { name: 'EW Study' }).click();
  await expect(page.locator('#lesson-title')).toContainText('three divisions of EW');
  expect(await page.evaluate(key => localStorage.getItem(key), ewKey)).toBeNull();
  await page.getByLabel('Choose a lesson').selectOption('spectrum-management');
  await page.getByRole('button', { name: 'Mark lesson complete', exact: true }).click();
  await expect(page.locator('#lesson-progress')).toHaveText(`1 of ${totalLessons} lessons complete`);
  await page.reload();
  await expect(page.locator('#lesson-progress')).toHaveText(`1 of ${totalLessons} lessons complete`);
  await page.getByLabel('Choose a lesson').selectOption('spectrum-management');
  await expect(page.getByRole('button', { name: 'Mark lesson incomplete' })).toBeVisible();
  await expect(page.locator('#practice-summary')).toContainText('3 cards');
  await expect(page.locator('#card-answer')).toBeEmpty();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(page.locator('#card-answer')).toContainText('Spectrum management.');
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await page.getByLabel('Lesson scope').selectOption('all');
  await expect(page.locator('#practice-summary')).toContainText(`${totalQuestions} cards`);
  await page.getByLabel('Practice cards').selectOption('review');
  await expect(page.locator('#practice-summary')).toContainText('1 card');
  await expect(page.locator('#publication-list article')).toHaveCount(10);
  await expect(page.locator('#publication-list')).toContainText('22 August 2025');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset EW progress' }).click();
  await expect(page.locator('#lesson-progress')).toHaveText(`0 of ${totalLessons} lessons complete`);
  expect(await page.evaluate(key => localStorage.getItem(key), ewKey)).toBeNull();
  expect(await page.evaluate(key => localStorage.getItem(key), phaseKey)).toBe(sentinel);
  expect(await page.evaluate(key => localStorage.getItem(key), acronymKey)).toBe(sentinel);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('a failed content request can be retried without leaving the page', async ({ page }) => {
  await page.route('**/study/17e/acronyms/data.json', route => route.fulfill({ status: 503, body: 'Unavailable' }), { times: 1 });
  await page.goto('/study/17e/acronyms/');
  await expect(page.locator('#load-status')).toContainText('Could not load');
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.locator('#study-content')).toBeVisible();
  await expect(page.locator('#reference-heading')).toBeFocused();
});

test('publication courses support deep links, topic search, ordered study and traceable coverage', async ({ page }) => {
  const course = curriculum.courses.find((item: { id: string }) => item.id === 'atp60270');
  const lessons = curriculum.lessons.filter((item: { courseId: string }) => item.courseId === course.id);
  const questions = lessons.reduce((total: number, item: { questions: unknown[] }) => total + item.questions.length, 0);
  await page.goto(`/study/ew/?course=${course.id}&lesson=${lessons[0].id}#lessons`);
  await expect(page.getByLabel('Choose a course')).toHaveValue(course.id);
  await expect(page.locator('#lesson-title')).toHaveText(lessons[0].title);
  await expect(page.getByRole('button', { name: 'Previous lesson' })).toBeDisabled();
  await expect(page.locator('#course-list article')).toHaveCount(curriculum.courses.length);
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(page.locator('#lesson-title')).toHaveText(lessons[1].title);
  await expect(page).toHaveURL(new RegExp(`lesson=${lessons[1].id}`));
  await page.getByLabel('Lesson scope').selectOption('course');
  await expect(page.locator('#practice-summary')).toContainText(`${questions} cards`);
  await page.getByLabel('Choose a lesson').selectOption(lessons.at(-1).id);
  await expect(page.getByRole('button', { name: 'Next lesson', exact: true })).toBeDisabled();
  await page.locator('#course-map-link').click();
  await expect(page.getByLabel('Publication to inspect')).toHaveValue(course.id);
  await expect(page.locator('#coverage-units details')).toHaveCount(course.units.length);
  await page.locator('#coverage-units summary').first().click();
  await expect(page.locator('#coverage-units details').first()).toContainText('Topics to account for');
  await expect(page.locator('#coverage-units details').first().getByRole('link', { name: 'Open the source reading' })).toHaveAttribute('href', /^https:\/\/.+\.mil\//);
  await page.getByLabel('Find a topic across all courses').fill('intermodulation');
  await expect(page.locator('#topic-matches li')).not.toHaveCount(0);
  await page.locator('#topic-matches a').first().click();
  await expect(page).toHaveURL(/#lesson-reader$/);
  await expect(page.locator('#lesson-content')).toContainText(/intermodulation/i);
  await page.reload();
  await expect(page.locator('#lesson-content')).toContainText(/intermodulation/i);
  await page.getByLabel('Publication to inspect').selectOption('jp385');
  await expect(page.locator('#coverage-context')).toContainText('2020');
  await expect(page.locator('#coverage-context')).toContainText('2026');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('legacy EW progress loads and browser history restores the displayed lesson', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify({
      ratings: { 'spectrum-management:q1': 'review' },
      completed: { 'spectrum-management': true },
    }));
  }, { key: ewKey });
  await page.goto('/study/ew/?course=orientation&lesson=spectrum-management#lessons');
  await expect(page.locator('#lesson-progress')).toHaveText(`1 of ${totalLessons} lessons complete`);
  await expect(page.getByRole('button', { name: 'Mark lesson incomplete', exact: true })).toBeVisible();
  await page.getByLabel('Practice cards').selectOption('review');
  await expect(page.locator('#practice-summary')).toContainText('1 card');
  await expect(page.locator('#card-answer')).toBeEmpty();
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Courses', exact: true }).click();
  await page.locator('#course-list').getByRole('link', { name: 'Open FM 3-12', exact: true }).click();
  await expect(page.getByLabel('Choose a course')).toHaveValue('fm312');
  await expect(page).toHaveURL(/course=fm312.*#lesson-reader$/);
  await page.goBack();
  await expect(page.getByLabel('Choose a course')).toHaveValue('orientation');
  await expect(page.getByLabel('Choose a lesson')).toHaveValue('spectrum-management');
  await expect(page.locator('#practice-summary')).toContainText('1 card');
});

test('blocked browser storage still permits recall practice', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
  });
  await page.goto('/study/17e/acronyms/');
  await expect(page.locator('#storage-status')).toBeVisible();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await expect(page.locator('#practice-summary')).toContainText('1 marked for review');
  await expect(page.locator('#storage-status')).toContainText('could not save');
});

test('Soldier Study shares navigation, recall and coverage while keeping guest progress separate', async ({ page }) => {
  await page.goto('/study/');
  await page.getByRole('heading', { name: 'Soldier Study' }).getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'Soldier Study', exact: true })).toBeVisible();
  await expect(page.locator('#curriculum-stats')).toHaveText('4 courses · 16 lessons · 39 recall questions');
  await expect(page.getByRole('button', { name: 'Previous lesson' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await expect(page.locator('#lesson-title')).toHaveText('Read a task standard');
  await page.getByLabel('Choose a course').selectOption('casualty-response');
  await expect(page.locator('#lesson-title')).toHaveText('First-responder roles and TCCC phases');
  await page.getByLabel('Choose a lesson').selectOption('casualty-card-and-mist');
  await expect(page.locator('#lesson-content')).toContainText('L for local or Z for Zulu');
  await expect(page.locator('#lesson-content')).toContainText('21 July 2025');

  await page.getByLabel('Find a topic across all courses').fill('potable palatable');
  await page.getByRole('link', { name: 'Potable water from source to cup', exact: true }).first().click();
  await expect(page.locator('#lesson-title')).toBeFocused();
  await page.getByRole('link', { name: 'Practice this lesson' }).click();
  await expect(page.locator('#card-answer')).toBeHidden();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(page.locator('#card-answer')).toContainText('Use the verified supply');
  const waterSource = page.locator('#card-answer').getByRole('link', { name: /Unit Field Sanitation Teams/ });
  await expect(waterSource).toBeVisible();
  await expect(waterSource).toHaveAttribute('href', /ARN44577-ATP_4-25\.12/);
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await page.getByRole('button', { name: 'Mark lesson complete', exact: true }).click();
  await page.reload();
  await expect(page.locator('#lesson-title')).toHaveText('Potable water from source to cup');
  await expect(page.getByRole('button', { name: 'Mark lesson incomplete', exact: true })).toBeVisible();
  await page.getByLabel('Practice cards').selectOption('review');
  await expect(page.locator('#practice-summary')).toContainText('1 marked for review');
  await page.getByRole('link', { name: 'View this course’s coverage' }).click();
  await expect(page.getByLabel('Course to inspect')).toHaveValue('field-health');
  await page.getByLabel('Course to inspect').selectOption('foundations');
  const mapTask = page.locator('#coverage-units summary').filter({ hasText: 'Orient a map to the ground on a training lane' });
  await mapTask.click();
  await expect(page.locator('#coverage-units')).toContainText('Task IDs: 071-COM-1012');
  await expect(page.locator('#coverage-units summary').filter({ hasText: 'Verify the 2025 common-tasks roster' })).toContainText('Blocked pending verification');

  const otherKeys = ['ew-study.progress.v1', 'army-acronyms.progress.v1', 'phaseup17e.progress.v1'];
  const before = await page.evaluate(keys => {
    for (const key of keys) localStorage.setItem(key, '{"sentinel":true}');
    return JSON.parse(localStorage.getItem('soldier-study.progress.v1') ?? '{}');
  }, otherKeys);
  expect(before).toEqual({
    ratings: { 'potable-water-chain:unmarked-container': 'review' },
    completed: { 'potable-water-chain': true },
  });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset Soldier Study progress', exact: true }).click();
  await expect(page.locator('#lesson-progress')).toHaveText('0 of 16 lessons complete');
  expect(await page.evaluate(keys => [localStorage.getItem('soldier-study.progress.v1'), ...keys.map(key => localStorage.getItem(key))], otherKeys))
    .toEqual([null, '{"sentinel":true}', '{"sentinel":true}', '{"sentinel":true}']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('contact lives on its own route and study corrections remain accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-contact-form]')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Contact' })).toHaveCount(0);
  const contact = page.getByRole('contentinfo').getByRole('link', { name: 'Contact', exact: true });
  await expect(contact).toHaveAttribute('href', '/connect/');
  await contact.click();
  await expect(page).toHaveURL(/\/connect\/$/);
  await expect(page.locator('[data-contact-form]')).toHaveCount(1);
  await page.goto('/study/');
  await expect(page.getByRole('heading', { name: 'Help keep Army Study current' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Study tools' }).getByRole('link', { name: /Contact/ })).toHaveCount(0);
  await page.locator('.study-footer').getByRole('link', { name: 'Contact / report a correction' }).click();
  await expect(page).toHaveURL(/\/connect\/\?topic=army-study/);
  await expect(page.getByRole('heading', { name: 'Report a study correction' })).toBeVisible();
});
