import { expect, test } from '@playwright/test';

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
  await page.getByRole('navigation', { name: 'Study tools' }).getByRole('link', { name: 'Army Acronyms' }).click();
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
  await expect(page.locator('#lesson-progress')).toHaveText('1 of 5 lessons complete');
  await page.reload();
  await expect(page.locator('#lesson-progress')).toHaveText('1 of 5 lessons complete');
  await page.getByLabel('Choose a lesson').selectOption('spectrum-management');
  await expect(page.getByRole('button', { name: 'Mark lesson incomplete' })).toBeVisible();
  await expect(page.locator('#practice-summary')).toContainText('3 cards');
  await expect(page.locator('#card-answer')).toBeEmpty();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(page.locator('#card-answer')).toContainText('Spectrum management.');
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await page.getByLabel('Lesson scope').selectOption('all');
  await expect(page.locator('#practice-summary')).toContainText('15 cards');
  await page.getByLabel('Practice cards').selectOption('review');
  await expect(page.locator('#practice-summary')).toContainText('1 card');
  await expect(page.locator('#publication-list article')).toHaveCount(10);
  await expect(page.locator('#publication-list')).toContainText('22 August 2025');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset EW progress' }).click();
  await expect(page.locator('#lesson-progress')).toHaveText('0 of 5 lessons complete');
  expect(await page.evaluate(key => localStorage.getItem(key), ewKey)).toBeNull();
  expect(await page.evaluate(key => localStorage.getItem(key), phaseKey)).toBe(sentinel);
  expect(await page.evaluate(key => localStorage.getItem(key), acronymKey)).toBe(sentinel);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('a failed content request can be retried without leaving the page', async ({ page }) => {
  await page.route('**/study/acronyms/data.json', route => route.fulfill({ status: 503, body: 'Unavailable' }), { times: 1 });
  await page.goto('/study/acronyms/');
  await expect(page.locator('#load-status')).toContainText('Could not load');
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.locator('#study-content')).toBeVisible();
  await expect(page.locator('#reference-heading')).toBeFocused();
});

test('blocked browser storage still permits recall practice', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
  });
  await page.goto('/study/acronyms/');
  await expect(page.locator('#storage-status')).toBeVisible();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await expect(page.locator('#practice-summary')).toContainText('1 marked for review');
  await expect(page.locator('#storage-status')).toContainText('could not save');
});
