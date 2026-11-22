import { expect, test } from '@playwright/test';

const studies = [
  ['equityscout', 'EquityScout'],
  ['lintel', 'Lintel'],
  ['leverline', 'Leverline'],
  ['ascent', 'Ascent'],
  ['decision-intelligence-engine', 'Decision'],
  ['convergence', 'Convergence'],
] as const;

test('commercial projects remain navigable as static case studies', async ({ page }) => {
  await page.goto('/projects/');
  for (const [slug, title] of studies) {
    await expect(page.locator('main').locator('a[href="/projects/' + slug + '/"]')).toHaveCount(1);
    const result = await page.request.get('/projects/' + slug + '/');
    expect(result.status()).toBe(200);
    const html = await result.text();
    expect(html).toContain(title);
    expect(html).toContain('/media/showcase/' + slug + '.svg');
    expect(html).not.toMatch(/<iframe|href="\/downloads\/|src="\/apps\/(?:lintel|leverline)\//);
  }
});


test('Apex and Decision are startups and all displayed project titles are one word', async ({ page }) => {
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const root = route === '/' ? page.locator('#projects') : page.locator('main');
    const startups = root.locator('section.project-group').filter({
      has: page.getByRole('heading', { name: 'Businesses + Startups' }),
    });
    const research = root.locator('section.project-group').filter({
      has: page.getByRole('heading', { name: 'Research + Fun Projects' }),
    });
    for (const slug of ['career-intelligence-aviation', 'decision-intelligence-engine']) {
      await expect(startups.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(1);
      await expect(research.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(0);
    }
    const titles = await root.locator('.selected-card h3, .selected-card h4, .project-card h3').allTextContents();
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(title.trim()).toMatch(/^\S+$/u);
  }
});

test('Muster has one startup card and a case study linking to the public app', async ({ page }) => {
  const path = '/projects/muster/';
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const card = page.locator('article.selected-card').filter({
      has: page.getByRole('heading', { name: 'Muster', exact: true }),
    });
    await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Businesses + Startups' }).locator(card)).toHaveCount(1);
    await expect(card).toContainText('A public research workspace');
    await card.getByRole('link', { name: 'Explore Muster →' }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { name: 'Muster', level: 1 })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Open Muster', exact: true }))
    .toHaveAttribute('href', 'https://muster.jacobroutzong.dev/');
  await expect(page.getByText('No sign-in required.', { exact: false })).toBeVisible();
  await expect(page.locator('iframe, #muster-data')).toHaveCount(0);
});

test('Empirava is the single flagship listing and supports keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  if (await toggle.isVisible()) {
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work' }).press('Enter');
  await expect(page).toHaveURL('/projects/');

  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const projects = route === '/' ? page.locator('#projects') : page.getByRole('main');
    await expect(projects.locator('a[href="/projects/empirava/"]')).toHaveCount(1);
    const flagship = projects.getByRole('link', { name: /Explore Empirava/ });
    await expect(flagship).toBeVisible();
    for (const slug of ['tunera', 'causarium', 'recursa', 'harness2-lab']) {
      await expect(projects.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(0);
    }
    await flagship.press('Enter');
    await expect(page).toHaveURL('/projects/empirava/');
    await expect(page.getByRole('heading', { name: 'Empirava', level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/projects\/empirava\/$/);
    await expect(page.getByRole('link', { name: 'Open the protected Empirava preview' }))
      .toHaveAttribute('href', 'https://empirava.jacobroutzong.dev/');
    expect(await page.locator('html').evaluate(root => root.scrollWidth <= root.clientWidth)).toBe(true);
  }

  await page.goto('/projects/tunera/');
  await page.getByRole('link', { name: /Explore Empirava/ }).press('Enter');
  await expect(page).toHaveURL('/projects/empirava/');
  await page.getByRole('link', { name: 'Recursa research case study' }).press('Enter');
  await expect(page).toHaveURL('/projects/recursa/');
});

test('historical Recursa Studio retains its two navigable research areas', async ({ page }) => {
  await page.goto('/projects/recursa/');
  await expect(page.getByRole('heading', { name: 'Recursa', level: 1 })).toBeVisible();
  for (const name of ['Application Synthesis', 'Agent Optimization']) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }
  const areas = page.getByRole('navigation', { name: 'Recursa Studio research areas' });
  const replay = areas.getByRole('link', { name: 'Open Application Synthesis replay' });
  await replay.press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/studio\/(?:#overview)?$/);
  await expect(page.getByRole('heading', { name: 'Recursa Studio', level: 1 })).toBeVisible();
  for (const name of ['Application Synthesis', 'Agent Optimization']) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Browse specifications' }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/studio\/#playground$/);
  await expect(page.locator('#preset-list button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Benchmarks' }).press('Enter');
  await expect(page.locator('#series-results')).toBeVisible();

  await page.goto('/projects/recursa/');
  // Metadata is served by the Cloudflare proxy in production. Keep CI offline.
  await page.route('**/api/harness2-lab/meta', route => route.fulfill({
    json: { components: [], tasks: [] },
  }));
  await areas.getByRole('link', { name: 'Open Agent Optimization lab' }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/harness2-lab\/$/);
  await expect(page).toHaveTitle('Agent Optimization · Recursa Studio');
  await expect(page.getByRole('link', { name: /Run the offline demo/ })).toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/harness2-lab\/#\/library$/);
  await expect(page.getByRole('heading', { name: 'The improvement library R', level: 2 })).toBeVisible();
  await page.getByRole('link', { name: 'Recursa Studio' }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/$/);
});

test('Axiom Studio is featured and Q-SPECTRA remains an independent case study', async ({ page }) => {
  const optimization = '/labs/scientific-systems/axiom-studio/';
  const quantum = '/projects/q-spectra/';
  for (const listing of ['/', '/projects/']) {
    await page.goto(listing);
    const selected = page.locator('article.selected-card');
    const axiom = selected.filter({ has: page.getByRole('heading', { name: 'Axiom', exact: true }) });
    await expect(axiom).toHaveCount(1);
    await expect(selected.filter({ hasText: 'Scientific Systems Lab' })).toHaveCount(0);
    await expect(selected.locator('a[href="' + quantum + '"]')).toHaveCount(0);
    const start = axiom.getByRole('link', { name: 'Explore Axiom →' });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute('href', optimization);
    await start.click();
    await expect(page).toHaveURL(optimization);
  }

  await page.goto('/projects/');
  await page.getByRole('link', { name: /Q-SPECTRA/ }).click();
  await expect(page).toHaveURL(quantum);
  await expect(page.getByRole('heading', { name: 'Explore the simulations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Live demo' })).toHaveAttribute('href', 'https://qspectra.jacobroutzong.dev/');
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/jacobhroutzong/q-spectra-17e-workbench');
});
