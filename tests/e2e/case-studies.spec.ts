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
