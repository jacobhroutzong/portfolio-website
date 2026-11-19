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
