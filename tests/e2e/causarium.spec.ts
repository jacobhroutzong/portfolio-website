import { expect, test } from '@playwright/test';

test.describe('Causarium exhibit without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('recorded values and controls are legible and keyboard accessible', async ({ page }) => {
    await page.goto('/projects/causarium/');
    await expect(page.getByRole('heading', { name: 'Causarium.' })).toBeVisible();
    await expect(page.getByText('9.7–11.0%')).toBeVisible();
    await expect(page.getByRole('cell', { name: '+3.6892', exact: true }).first()).toBeVisible();
    const secondMap = page.getByText('France / Germany · layer × position', { exact: true });
    await secondMap.focus();
    await secondMap.press('Enter');
    await expect(page.getByRole('table', { name: 'France / Germany · change in logit margin' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'Alice · name' }).first()).toBeVisible();
    const swaps = page.getByText('Arithmetic B · both swap directions', { exact: true });
    await swaps.click();
    await expect(page.getByRole('table', { name: 'Arithmetic B · swaps and shams' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '−2.3750', exact: true })).toBeVisible();
    if ((page.viewportSize()?.width ?? 1000) < 500) {
      const region = page.getByRole('region', { name: 'Arithmetic B · swaps and shams' });
      await region.focus();
      await region.press('ArrowRight');
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    }
    await expect(page.getByText(/prompt specificity remains unresolved/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download evidence JSON' })).toHaveAttribute('href', '/media/causarium/evidence-v1.json');
    const width = await page.locator('html').evaluate(element => [element.scrollWidth, element.clientWidth]);
    expect(width[0]).toBeLessThanOrEqual(width[1]);
  });
});

test('project navigation and existing public research routes remain available', async ({ page, request }) => {
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: 'Explore the research exhibit' })).toHaveAttribute('href', '/projects/causarium/');
  }
  for (const route of ['/projects/tunera/', '/projects/recursa/', '/projects/harness2-lab/', '/labs/scientific-systems/']) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }
  const asset = await request.get('/media/causarium/evidence-v1.json');
  expect(asset.ok()).toBe(true);
  expect(await asset.text()).not.toMatch(/tunera-private|prompt_ids|activations|\/mnt\/|[A-Z]:[\\/]/i);
});
