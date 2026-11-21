import { test, expect } from '@playwright/test';
test('Scientific lab routes, honest statuses and recorded controls', async ({ page }) => {
  await page.goto('/labs/scientific-systems/');
  await expect(page.getByRole('heading', { name: 'Axiom Studio', level: 1 })).toBeVisible();
  const switcher = page.getByRole('navigation', { name: 'Axiom Studio' });
  await expect(switcher).toHaveCSS('position', 'static');
  await expect(switcher.getByRole('link', { name: 'Axiom Studio', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.lab-card')).toHaveCount(7);
  await expect(page.locator('.lab-card .lab-status').filter({ hasText: /^Stable$/ })).toHaveCount(2);
  await expect(page.locator('.lab-card').filter({ hasText: 'Planning' })).toHaveCount(5);
  expect(await page.locator('.lab-card').first().evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(250);
  await page.getByLabel('Inspect a stage').selectOption('2');
  await expect(page.locator('[data-lu-stage="2"]')).toBeVisible();
  await expect(page.locator('[data-lu-stage="0"]')).toBeHidden();
  await page.getByRole('button', { name: 'Show all stages' }).click();
  await expect(page.locator('[data-lu-stage="0"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
  await page.screenshot({ path: `test-results/scientific-lab-${test.info().project.name}.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: `test-results/scientific-lab-dark-${test.info().project.name}.png`, animations: 'disabled' });
  await page.locator('[data-project="numerical"] a').click();
  await expect(page.getByRole('heading', { name: 'Numerical Workbench' })).toBeVisible();
  await expect(page.getByRole('table').filter({ hasText: 'Matrix order' })).toBeVisible();
  await expect(switcher.getByRole('link', { name: 'Numerical Workbench' })).toHaveAttribute('aria-current', 'page');
  await switcher.getByRole('link', { name: 'Symbolic Workbench' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Symbolic Workbench' })).toBeVisible();
  await expect(switcher.getByRole('link', { name: 'Symbolic Workbench' })).toHaveAttribute('aria-current', 'page');
  await page.getByText('Recorded native differentiation examples', { exact: true }).click();
  await page.locator('summary').filter({ hasText: 'x^0' }).click();
  await expect(page.locator('.lab-research-disclosure details').filter({ hasText: 'x^0' })).toContainText('x ≠ 0');
  await expect(page.locator('.katex-mathml').first()).toBeAttached();
  await expect(page.locator('#native')).toContainText('outside the browser workbench’s scope');
  await switcher.getByRole('link', { name: 'Technical documentation' }).click();
  await expect(page).toHaveURL(/#documentation$/);
  await expect(page.getByRole('link', { name: 'Browser release manifest' })).toBeVisible();
  await page.getByRole('link', { name: 'Phase 5 QR least squares (native only)' }).click();
  await expect(page.locator('#native')).toContainText('outside the browser workbench’s scope');
});
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Axiom Studio navigation is keyboard accessible across all experiences', async ({ page }) => {
    const base = '/labs/scientific-systems/';
    await page.goto(base);
    await expect(page.locator('.lab-card')).toHaveCount(7);
    await expect(page.locator('[data-lu-stage="2"]')).toBeVisible();

    const switcher = page.getByRole('navigation', { name: 'Axiom Studio' });
    const overview = switcher.getByRole('link', { name: 'Axiom Studio', exact: true });
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await overview.focus();

    for (const [name, slug] of [
      ['Optimization Lab', 'axiom-studio'],
      ['Numerical Workbench', 'numerical'],
      ['Symbolic Workbench', 'symbolic'],
    ]) {
      const next = switcher.getByRole('link', { name, exact: true });
      await page.keyboard.press('Tab');
      await expect(next).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(base + slug + '/');
      await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
      await expect(switcher.locator('[aria-current="page"]')).toHaveText(name);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await next.focus();
    }

    await page.keyboard.press('Tab');
    const docs = switcher.getByRole('link', { name: 'Technical documentation' });
    await expect(docs).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(base + '#documentation');
    await expect(page.getByRole('link', { name: 'Engine and runtime licenses' })).toBeVisible();
  });
});
