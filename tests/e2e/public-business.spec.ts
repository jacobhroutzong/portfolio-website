import { expect, test } from '@playwright/test';

test('old business URLs serve public marketing, contact and calculators without legacy assets', async ({ page, request }) => {
  for (const brand of ['lintel', 'leverline']) {
    const base = '/apps/' + brand + '/';
    await page.goto(base);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto(base + 'contact/');
    await expect(page.getByRole('link', { name: new RegExp('Contact about ' + brand, 'i') })).toHaveAttribute('href', '/connect/');
    expect((await request.get(base + 'partners/')).ok()).toBeTruthy();
    for (const path of ['assets/tools.js', 'assets/catalog.js', 'assets/site.js']) {
      expect((await request.get(base + path, {maxRedirects: 0})).status()).toBe(404);
    }
  }
  await page.goto('/apps/lintel/savings/');
  await page.getByLabel('Typical cost of one ($)').fill('25000');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#business-estimate')).toContainText('$450');
  await page.goto('/apps/leverline/roi-calculator/');
  await page.getByLabel('Missed calls per month').fill('56');
  await page.getByRole('button', { name: 'Calculate estimate' }).click();
  await expect(page.locator('#business-estimate')).toContainText('$54,600');
});
