import { expect, test } from '@playwright/test';

test('Fieldsense editorial lab keeps the original paper distinct from the recorded replay', async ({ page }) => {
  await page.goto('/projects/fieldsense/lab/');
  await expect(page.locator('#fieldsense-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('heading', { name: /When, where, and how much/i })).toBeVisible();
  await expect(page.locator('.fs-intro-quote blockquote'))
    .toContainText('We will use Markov Chain Decision Process to prescribe optimal irrigation actions');
  await expect(page.getByText(/forecast inputs, not live sensor feeds/i)).toHaveCount(0);
  await expect(page.locator('.fs-research-footnote blockquote')).toContainText([
    'To forecast crop yield',
    'Resource Availability; Water, fertilizer, labor, equipment',
  ]);
  await page.getByText('What do the field parameters mean?').click();
  await expect(page.getByText(/MDP scores are estimated future rewards/)).toBeVisible();
  await page.getByText('What do the resource parameters mean?').click();
  await expect(page.getByText(/One of three illustrative resource-intensity choices/)).toBeVisible();
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
  await expect(page.getByRole('link', { name: 'Project overview' })).toBeVisible();
  const overflow = await page.locator('#fieldsense-app').evaluate(root => root.scrollWidth > root.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('Fieldsense case study quotes the original paper without claiming field deployment', async ({ page }) => {
  await page.goto('/projects/fieldsense/');
  await expect(page.getByRole('heading', { name: 'Fieldsense', exact: true })).toBeVisible();
  await expect(page.getByText(/To best allocate resources, we will implement Mixed-Integer Linear Programming/)).toBeVisible();
  await expect(page.getByText(/verbatim excerpts from the original 2025 submission/i)).toBeVisible();
  await expect(page.getByText(/Weather data; temperature, rainfall, and humidity/)).toBeVisible();
  await expect(page.getByText(/Crop data; crop type, seed variety, planting date/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reading the parameters' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Live demo' })).toHaveAttribute('href', 'https://fieldsense.jacobroutzong.dev/');
});

test('field selection and daily water cues work with a keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/fieldsense/lab/');
  const picker = page.getByRole('group', { name: 'Inspect a field' });
  await picker.getByRole('button', { name: /North Meadow/ }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('#fs-field-name')).toHaveText('East Acre');
  await expect(picker.getByRole('button', { name: /East Acre/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#fs-play')).toBeDisabled();
  await page.locator('#fs-day').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#fs-day-chip')).toHaveText('Day 7 / 7');
  const watering = page.locator('#fs-zone-0.fs-watering');
  await expect(watering.locator('.fs-pipe-flow')).toHaveCSS('opacity', '1');
  await expect(watering.locator('.fs-spray')).not.toHaveCSS('opacity', '0');
  await expect(watering.locator('.fs-spray path')).toHaveCSS('animation-name', 'none');
});
