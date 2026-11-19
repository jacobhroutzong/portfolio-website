import { expect, test } from '@playwright/test';

const studies = [
  ['equityscout', 'EquityScout'],
  ['lintel', 'Lintel'],
  ['leverline', 'Leverline'],
  ['ascent', 'Ascent'],
  ['decision-intelligence-engine', 'Decision Intelligence Engine'],
  ['tunera', 'Tunera'],
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

test('Recursa Studio has one listing and two navigable research areas', async ({ page }) => {
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const main = page.getByRole('main');
    const listing = main.locator('a[href="/projects/recursa/"]');
    await expect(listing).toHaveCount(1);
    await expect(main.locator('a[href="/projects/harness2-lab/"]')).toHaveCount(0);
    await expect(main.getByText('Harness² Lab', { exact: true })).toHaveCount(0);
    const research = main.getByRole('region', { name: 'Research + Fun Projects' });
    await research.getByRole('button', { name: /Show \d+ more projects?/ }).press('Enter');
    await expect(listing).toBeVisible();
    await expect(listing).toHaveText(/Explore Recursa Studio/);
  }

  await page.getByRole('link', { name: /Explore Recursa Studio/ }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/$/);
  await expect(page.getByRole('heading', { name: 'Recursa Studio', level: 1 })).toBeVisible();
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
    const axiom = selected.filter({ has: page.getByRole('heading', { name: 'Axiom Studio', exact: true }) });
    await expect(axiom).toHaveCount(1);
    await expect(selected.filter({ hasText: 'Scientific Systems Lab' })).toHaveCount(0);
    await expect(selected.locator('a[href="' + quantum + '"]')).toHaveCount(0);
    const start = axiom.getByRole('link', { name: 'Start with the Optimization Lab' });
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
