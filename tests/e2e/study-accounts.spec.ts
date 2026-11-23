import { expect, test, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.skip(process.env.STUDY_ACCOUNTS_STAGING !== '1', 'Account tests require the explicitly enabled staging build.');

const service = 'https://grpwacfkhwwifnjantdn.supabase.co';
const authKey = 'army-study.auth.v1';
const userA = '00000000-0000-4000-8000-00000000000a';
const userB = '00000000-0000-4000-8000-00000000000b';
const ewKey = 'ew-study.progress.v1';
const acronymKey = 'army-acronyms.progress.v1';
const phaseKey = 'phaseup17e.progress.v1';
const cards = JSON.parse(readFileSync(new URL('../../public/study/17e/cards.json', import.meta.url), 'utf8')).cards;
const firstPhaseCard = cards[0];

type Payload = Record<string, unknown>;
type Row = { revision: number; payload: Payload; reset: boolean };
type Receipt = { user: string; area: string; body: Payload };

// Synthetic, unsigned test fixtures. Every request to the Supabase origin is
// intercepted below. These are not credentials and never reach a real service.
function session(userId = userA) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ sub: userId, aud: 'authenticated', role: 'authenticated', exp })).toString('base64url');
  return {
    access_token: `${header}.${claims}.synthetic-test-signature`,
    refresh_token: `synthetic-test-refresh-${userId}`,
    expires_in: 3600, expires_at: exp, token_type: 'bearer',
    user: {
      id: userId, aud: 'authenticated', role: 'authenticated',
      email: userId === userA ? 'learner-a@example.invalid' : 'learner-b@example.invalid',
      app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
    },
  };
}

async function seed(page: Page, guest: Record<string, Payload>, userId = userA) {
  await page.addInitScript(({ authKey, storedSession, guest }) => {
    if (localStorage.getItem('study-test-seeded') === 'yes') return;
    localStorage.setItem('study-test-seeded', 'yes');
    localStorage.setItem(authKey, JSON.stringify(storedSession));
    for (const [key, value] of Object.entries(guest)) localStorage.setItem(key, JSON.stringify(value));
  }, { authKey, storedSession: session(userId), guest });
}

async function mockProgressService(page: Page) {
  const rows = new Map<string, Row>();
  const writes: Receipt[] = [];
  let holdNextWrite = false;
  let releaseWrite: (() => void) | null = null;
  const key = (area: string, user: string) => `${user}:${area}`;
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route(`${service}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.pathname === '/auth/v1/logout') { await route.fulfill({ status: 204 }); return; }
    if (url.pathname !== '/rest/v1/army_study_progress') {
      await json(route, { message: 'Unexpected mocked service request.' }, 500); return;
    }
    const headers = await request.allHeaders();
    const profileHeader = method === 'GET' ? 'accept-profile' : 'content-profile';
    if (headers[profileHeader] !== 'army_study_api') {
      await json(route, { message: 'Expected the Army Study API schema profile.' }, 406);
      return;
    }
    const token = headers.authorization?.replace(/^Bearer /, '') || '';
    let tokenUser = '';
    try { tokenUser = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub; } catch { /* denied below */ }
    const body = method === 'GET' ? {} : request.postDataJSON() as Payload;
    const requestedUser = method === 'POST' ? String(body.user_id) : (url.searchParams.get('user_id') || '').replace(/^eq\./, '');
    const area = method === 'POST' ? String(body.area) : (url.searchParams.get('area') || '').replace(/^eq\./, '');
    if (![userA, userB].includes(tokenUser) || tokenUser !== requestedUser) {
      await json(route, { code: '42501', message: 'Account mismatch.' }, 403); return;
    }
    const rowKey = key(area, requestedUser);
    const existing = rows.get(rowKey);
    if (method === 'GET') { await json(route, existing ? [existing] : []); return; }
    if (method === 'POST' && existing) { await json(route, { code: '23505', message: 'Concurrent insert.' }, 409); return; }
    if (method === 'PATCH' && (!existing || String(existing.revision) !== (url.searchParams.get('revision') || '').replace(/^eq\./, ''))) {
      await json(route, []); return;
    }
    if (!['POST', 'PATCH'].includes(method)) { await json(route, { message: 'Unexpected method.' }, 405); return; }
    const saved = { revision: Number(body.revision), payload: body.payload as Payload, reset: body.reset === true };
    rows.set(rowKey, saved);
    writes.push({ user: requestedUser, area, body });
    if (holdNextWrite) {
      holdNextWrite = false;
      await new Promise<void>(resolve => { releaseWrite = resolve; });
    }
    try { await json(route, [saved], method === 'POST' ? 201 : 200); } catch { /* Client may have aborted during sign-out. */ }
  });
  return {
    writes,
    put(area: string, row: Row, user = userA) { rows.set(key(area, user), structuredClone(row)); },
    get(area: string, user = userA) { return rows.get(key(area, user)); },
    holdWrite() { holdNextWrite = true; },
    releaseWrite() { releaseWrite?.(); releaseWrite = null; },
  };
}

async function openAccount(page: Page) {
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Study account' })).toBeVisible();
}

test('the same compact, keyboard-accessible sign-in control appears on all study pages', async ({ page }) => {
  await mockProgressService(page);
  for (const path of ['/study/', '/study/ew/', '/study/soldier/', '/study/17e/', '/study/17e/acronyms/']) {
    await page.goto(path);
    const trigger = page.getByRole('button', { name: 'Sign in', exact: true });
    const menu = page.locator('#study-account-menu');
    await expect(trigger).toBeVisible();
    await expect(menu).toBeHidden();
    const bounds = await trigger.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(await trigger.evaluate(element => Boolean(element.closest('header')))).toBe(true);
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
    await expect(menu.getByText('Apple · Coming soon', { exact: true })).toBeVisible();
    await expect(menu.getByRole('button', { name: /Apple/ })).toHaveCount(0);
    await expect.poll(() => menu.locator('img:visible').evaluateAll(images =>
      images.filter(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0).length
    )).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('the homepage account menu offers area links without reading or importing progress', async ({ page }) => {
  await seed(page, { [ewKey]: { ratings: {}, completed: { 'ew-fundamentals': true } } });
  const server = await mockProgressService(page);
  const progressRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/rest/v1/army_study_progress')) progressRequests.push(request.method());
  });
  await page.goto('/study/');
  await openAccount(page);
  const menu = page.getByRole('dialog', { name: 'Study account' });
  await expect(menu).toContainText('learner-a@example.invalid');
  await expect(menu.getByRole('link', { name: 'EW Study', exact: true })).toHaveAttribute('href', '/study/ew/');
  await expect(menu.getByRole('button', { name: 'Import this browser’s progress', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  expect(progressRequests).toHaveLength(0);
  expect(server.writes).toHaveLength(0);
});

test('EW account progress loads, imports guest progress explicitly and saves without changing the guest copy', async ({ page }) => {
  const guest = { ratings: {}, completed: { 'spectrum-management': true } };
  await seed(page, { [ewKey]: guest });
  const server = await mockProgressService(page);
  server.put('ew', { revision: 2, payload: { ratings: {}, completed: { 'ew-fundamentals': true } }, reset: false });
  await page.goto('/study/ew/');
  await openAccount(page);
  await expect(page.locator('#study-account')).toContainText('learner-a@example.invalid');
  await expect(page.locator('#lesson-progress')).toContainText('1 of 92 lessons complete');
  await expect(page.getByRole('button', { name: 'Mark lesson incomplete', exact: true })).toBeVisible();
  expect(server.writes).toHaveLength(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Import this browser’s progress', exact: true }).click();
  await expect(page.locator('#lesson-progress')).toContainText('2 of 92 lessons complete');
  await expect(page.locator('.study-account-status')).toHaveText('Saved to your account.');
  await page.getByRole('button', { name: 'Mark lesson incomplete', exact: true }).click();
  await expect(page.locator('#lesson-progress')).toContainText('1 of 92 lessons complete');
  await expect.poll(() => server.get('ew')?.payload).toEqual({ ratings: {}, completed: { 'spectrum-management': true } });
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), ewKey)).toEqual(guest);
  await page.reload();
  await expect(page.locator('#lesson-progress')).toContainText('1 of 92 lessons complete');
  await expect(page.locator('.study-account-status')).toHaveText('Saved to your account.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('acronym account changes detect a remote reset and require an explicit conflict choice', async ({ page }) => {
  await seed(page, {});
  const server = await mockProgressService(page);
  server.put('acronyms', { revision: 1, payload: { ratings: { march: 'got-it' }, completed: {} }, reset: false });
  await page.goto('/study/17e/acronyms/');
  await expect(page.locator('#practice-summary')).toContainText('1 rated Got it');
  server.put('acronyms', { revision: 2, payload: { ratings: {}, completed: {} }, reset: true });
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: 'Review again', exact: true }).click();
  await expect(page.locator('#study-account-menu')).toBeHidden();
  await expect(page.locator('#study-account-indicator')).toHaveText('Resolve sync conflict');
  await openAccount(page);
  await expect(page.locator('.study-account-conflict')).toContainText('was reset on another device');
  expect(server.writes).toHaveLength(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Use saved account progress', exact: true }).click();
  await expect(page.locator('.study-account-conflict')).toBeHidden();
  await expect(page.locator('#practice-summary')).toContainText('0 marked for review · 0 rated Got it');
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await expect.poll(() => server.get('acronyms')?.revision).toBe(3);
  expect(server.get('acronyms')?.reset).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), acronymKey)).toBeNull();
});

test('PhaseUp imports are idempotent and signing out restores the separate guest progress', async ({ page }) => {
  const timestamp = '2026-11-22T12:00:00.000Z';
  const guest = {
    records: { [firstPhaseCard.id]: { attempts: 2, correct: 1, misses: 1, streak: 1, due: 0, last: 'known', updated: timestamp } },
    events: [{ id: firstPhaseCard.id, q: firstPhaseCard.q, cat: firstPhaseCard.cat, rating: 'known', date: timestamp }],
    exams: [{ when: timestamp, correct: 1, total: 2, category: 'vi' }],
  };
  await seed(page, { [phaseKey]: guest });
  const server = await mockProgressService(page);
  await page.goto('/study/17e/');
  await openAccount(page);
  await expect(page.locator('#study-account')).toContainText('learner-a@example.invalid');
  await expect(page.locator('#statSeen')).toHaveText('0');
  for (let attempt = 0; attempt < 2; attempt++) {
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Import this browser’s progress', exact: true }).click();
    await expect(page.locator('.study-account-status')).toHaveText('Saved to your account.');
  }
  await expect(page.locator('#statSeen')).toHaveText('1');
  expect(server.get('phaseup')?.payload.records).toEqual(guest.records);
  expect(server.get('phaseup')?.payload.events).toHaveLength(1);
  expect(server.get('phaseup')?.payload.exams).toHaveLength(1);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
  await expect(page.locator('#study-account')).toContainText('Guest progress is saved in this browser.');
  await expect(page.locator('#study-account')).not.toContainText('learner-a@example.invalid');
  await expect(page.locator('#statSeen')).toHaveText('1');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), phaseKey)).toEqual(guest);
  expect(await page.evaluate(key => localStorage.getItem(key), authKey)).toBeNull();
});

test('a pending account A save cannot replace account B progress after sign-out and reload', async ({ page }) => {
  await seed(page, {});
  const server = await mockProgressService(page);
  server.put('ew', { revision: 1, payload: { ratings: {}, completed: {} }, reset: false });
  server.put('ew', { revision: 7, payload: { ratings: {}, completed: { 'spectrum-management': true } }, reset: false }, userB);
  await page.goto('/study/ew/');
  await expect(page.locator('.study-account-status')).toHaveText('Saved to your account.');
  server.holdWrite();
  await page.getByRole('button', { name: 'Mark lesson complete', exact: true }).click();
  await expect.poll(() => server.writes.length).toBe(1);
  await expect(page.locator('.study-account-status')).toHaveText('Saving your progress…');
  await expect(page.locator('#study-account-indicator')).toHaveText('Saving…');
  await openAccount(page);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('#study-account')).not.toContainText('learner-a@example.invalid');
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: authKey, value: session(userB) });
  server.releaseWrite();
  await page.reload();
  await openAccount(page);
  await expect(page.locator('#study-account')).toContainText('learner-b@example.invalid');
  await expect(page.locator('#lesson-progress')).toContainText('1 of 92 lessons complete');
  await expect(page.getByRole('button', { name: 'Mark lesson complete', exact: true })).toBeVisible();
  expect(server.get('ew', userB)?.revision).toBe(7);
  expect(server.get('ew', userB)?.payload).toEqual({ ratings: {}, completed: { 'spectrum-management': true } });
  expect(server.writes.every(write => write.user === userA)).toBeTruthy();
  expect(await page.evaluate(key => localStorage.getItem(key), ewKey)).toBeNull();
});

test('Soldier Study imports and saves in its reserved account area and restores guest progress on sign-out', async ({ page }) => {
  const key = 'soldier-study.progress.v1';
  const { lessons } = JSON.parse(readFileSync(new URL('../../public/study/soldier/data.json', import.meta.url), 'utf8'));
  const [first, second, third] = lessons;
  const guest = { ratings: {}, completed: { [first.id]: true } };
  const ewGuest = { ratings: {}, completed: { 'ew-fundamentals': true } };
  await seed(page, { [key]: guest, [ewKey]: ewGuest });
  const server = await mockProgressService(page);
  server.put('soldier', { revision: 2, payload: { ratings: {}, completed: { [second.id]: true } }, reset: false });
  await page.goto('/study/soldier/');
  await openAccount(page);
  await expect(page.locator('#study-account')).toContainText('learner-a@example.invalid');
  await expect(page.locator('#lesson-progress')).toHaveText(`1 of ${lessons.length} lessons complete`);
  expect(server.writes).toHaveLength(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Import this browser’s progress', exact: true }).click();
  await expect(page.locator('.study-account-status')).toHaveText('Saved to your account.');
  await page.getByLabel('Choose a course').selectOption(third.courseId);
  await page.getByLabel('Choose a lesson').selectOption(third.id);
  await page.getByRole('button', { name: 'Mark lesson complete', exact: true }).click();
  await expect(page.locator('#lesson-progress')).toHaveText(`3 of ${lessons.length} lessons complete`);
  await expect.poll(() => server.get('soldier')?.payload).toEqual({
    ratings: {}, completed: { [first.id]: true, [second.id]: true, [third.id]: true },
  });
  expect(server.writes.every(write => write.area === 'soldier')).toBeTruthy();
  await openAccount(page);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('#progress-location')).toContainText('saved in this browser');
  await expect(page.locator('#lesson-progress')).toHaveText(`1 of ${lessons.length} lessons complete`);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(guest);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), ewKey)).toEqual(ewGuest);
});
