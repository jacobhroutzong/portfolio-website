import { expect, test } from '@playwright/test';

test('Fieldsense editorial lab keeps the original paper distinct from the recorded replay', async ({ page }) => {
  await page.goto('/projects/fieldsense/lab/');
  await expect(page.locator('#fieldsense-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('heading', { name: /When, where, and how much/i })).toBeVisible();
  await expect(page.locator('.fs-intro-quote blockquote'))
    .toContainText('We will use Markov Chain Decision Process to prescribe optimal irrigation actions');
  await expect(page.locator('.fs-origin-paper blockquote'))
    .toContainText('The data input to the system is crucial');
  await expect(page.locator('link[href="/media/fieldsense/fieldsense-editorial.css"]')).toHaveCount(1);

  await page.locator('#fs-day').fill('7');
  await expect(page.locator('#fs-mdp-water')).toContainText('645');
  await expect(page.locator('#fs-rule-water')).toContainText('945');
  await expect(page.locator('#fs-mdp-unmet')).toContainText('45.72');
  await page.locator('#fs-scenario').selectOption('strict_limit');
  await expect(page.getByRole('heading', { name: 'No feasible allocation' })).toBeVisible();
});

test('Fieldsense editorial remains readable at narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/projects/fieldsense/lab/');
  await expect(page.locator('#fieldsense-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.fs-intro-quote')).toBeVisible();
  const overflow = await page.locator('#fieldsense-app').evaluate(root => root.scrollWidth > root.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('Fieldsense case study quotes the original paper without claiming field deployment', async ({ page }) => {
  await page.goto('/projects/fieldsense/');
  await expect(page.getByRole('heading', { name: 'Fieldsense', exact: true })).toBeVisible();
  await expect(page.getByText(/To best allocate resources, we will implement Mixed-Integer Linear Programming/)).toBeVisible();
  await expect(page.getByText(/verbatim excerpts from the original 2025 submission/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Live demo' })).toHaveAttribute('href', 'https://fieldsense.jacobroutzong.dev/');
});
