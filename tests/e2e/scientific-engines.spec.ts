import { test, expect } from '@playwright/test';

test('C++ matrix worker solves, rejects singular matrices, resets and recovers', async ({ page }) => {
  await page.goto('/labs/scientific-systems/numerical/');
  const demo = page.locator('.cpp-demo');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Complete. Computed by the C++ engine.');
  await expect(demo.locator('[data-result]')).toContainText('Sequential pivot rows (zero-based): 1, 1');
  await expect(demo.locator('[data-result]')).toContainText('INFO: 0');
  await demo.locator('[name=a]').fill('1 2\n2 4');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Exactly singular');
  await demo.getByRole('button', { name: 'Cancel / reset engine' }).click();
  await expect(demo.getByRole('status')).toContainText('Cancelled');
  await demo.locator('[name=a]').fill('1 2\n3 4');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Complete.');
  await demo.locator('[name=a]').fill('NaN 2\n3 4');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('decimal numbers');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('C++ symbolic worker retains domain conditions and reports limits', async ({ page }) => {
  await page.goto('/labs/scientific-systems/symbolic/');
  const demo = page.locator('.cpp-demo');
  const run = demo.getByRole('button', { name: 'Differentiate with C++' });
  await run.click();
  await expect(demo.getByRole('status')).toContainText('Complete.');
  await expect(demo.locator('[data-result]')).toContainText('Derivative: ((3*(x^2))+2)');
  await demo.locator('[name=expression]').fill('x^0'); await run.click();
  await expect(demo.locator('[data-result]')).toContainText('Derivative: 0');
  await expect(demo.locator('[data-result]')).toContainText('x ≠ 0');
  await demo.locator('[name=expression]').fill('x^x'); await run.click();
  await expect(demo.getByRole('status')).toContainText('Input rejected:');
  await demo.locator('[name=expression]').fill('1/0'); await run.click();
  await expect(demo.getByRole('status')).toContainText('Division by zero');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing WebAssembly shows an actionable error and allows retry', async ({ page }) => {
  await page.route('**/engines/numerical.mjs', route => route.abort());
  await page.goto('/labs/scientific-systems/numerical/');
  const demo = page.locator('.cpp-demo');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Engine unavailable:');
  await expect(demo.getByRole('button', { name: 'Solve with C++' })).toBeEnabled();
});

test('load deadline terminates a stalled worker', async ({ page }) => {
  await page.clock.install();
  await page.route('**/engines/numerical.mjs', () => {});
  await page.goto('/labs/scientific-systems/numerical/');
  const demo = page.locator('.cpp-demo');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Loading');
  await page.clock.fastForward(21000);
  await expect(demo.getByRole('status')).toContainText('Time limit reached');
  await expect(demo.getByRole('button', { name: 'Solve with C++' })).toBeEnabled();
});
