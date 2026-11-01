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

// Stale-result regressions: a result must never stay visible, or appear, for inputs that are no longer in the form.
test.describe('stale results', () => {
  test('numerical: editing, resizing or choosing an example after a solve clears the old result', async ({ page }) => {
    await page.goto('/labs/scientific-systems/numerical/');
    const demo = page.locator('.cpp-demo');
    await demo.getByRole('button', { name: 'Solve with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await expect(demo.locator('[data-results]')).toBeVisible();
    await expect(demo.locator('[data-result]')).not.toBeEmpty();
    await demo.locator('[name=a]').fill('2 0\n0 2');
    await expect(demo.getByRole('status')).toContainText('Inputs changed');
    await expect(demo.locator('[data-results]')).toBeHidden();
    await expect(demo.locator('[data-result]')).toBeEmpty();
    await demo.getByRole('button', { name: 'Solve with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await demo.locator('[name=order]').fill('3'); await demo.locator('[name=order]').blur();
    await expect(demo.getByRole('status')).toContainText('Inputs changed');
    await expect(demo.locator('[data-results]')).toBeHidden();
    await demo.getByRole('button', { name: 'Solve with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await demo.getByRole('button', { name: 'Baseline 2 × 2' }).click();
    await expect(demo.getByRole('status')).toContainText('Inputs changed');
    await expect(demo.locator('[data-results]')).toBeHidden();
    await expect(demo.locator('[data-result]')).toBeEmpty();
  });

  test('numerical: an edit during an in-flight computation discards its output', async ({ page }) => {
    await page.route('**/engines/numerical.mjs', async route => { await new Promise(resolve => setTimeout(resolve, 1500)); await route.continue(); });
    await page.goto('/labs/scientific-systems/numerical/');
    const demo = page.locator('.cpp-demo');
    await demo.getByRole('button', { name: 'Solve with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Loading');
    await demo.locator('[name=a]').fill('2 0\n0 2');
    await demo.locator('[name=b]').fill('4 4\n6 6');
    await expect(demo.getByRole('status')).toContainText('Inputs changed while computing');
    await expect(demo.getByRole('status')).toContainText('discarded', { timeout: 10000 });
    await expect(demo.locator('[data-results]')).toBeHidden();
    await expect(demo.locator('[data-result]')).toBeEmpty();
    await expect(demo.getByRole('button', { name: 'Solve with C++' })).toBeEnabled();
    await demo.getByRole('button', { name: 'Solve with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await expect(demo.locator('[data-result]')).toContainText('2  2\n3  3');
    await expect(demo.locator('[data-results]')).toBeVisible();
  });

  test('symbolic: editing, choosing an example or changing the variable clears the old derivative', async ({ page }) => {
    await page.goto('/labs/scientific-systems/symbolic/');
    const demo = page.locator('.cpp-demo');
    const run = demo.getByRole('button', { name: 'Differentiate with C++' });
    await run.click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await expect(demo.locator('[data-results]')).toBeVisible();
    await demo.locator('[name=expression]').fill('x^2');
    await expect(demo.getByRole('status')).toContainText('Inputs changed');
    await expect(demo.locator('[data-results]')).toBeHidden();
    await expect(demo.locator('[data-result]')).toBeEmpty();
    await run.click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await demo.locator('[name=variable]').fill('y');
    await expect(demo.locator('[data-results]')).toBeHidden();
    await run.click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await demo.getByRole('button', { name: '1/x', exact: true }).click();
    await expect(demo.getByRole('status')).toContainText('Inputs changed');
    await expect(demo.locator('[data-results]')).toBeHidden();
  });

  test('symbolic: an edit during an in-flight computation discards its output', async ({ page }) => {
    await page.route('**/engines/symbolic.mjs', async route => { await new Promise(resolve => setTimeout(resolve, 1500)); await route.continue(); });
    await page.goto('/labs/scientific-systems/symbolic/');
    const demo = page.locator('.cpp-demo');
    await demo.getByRole('button', { name: 'Differentiate with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Loading');
    await demo.locator('[name=expression]').fill('x^2');
    await expect(demo.getByRole('status')).toContainText('Inputs changed while computing');
    await expect(demo.getByRole('status')).toContainText('discarded', { timeout: 10000 });
    await expect(demo.locator('[data-results]')).toBeHidden();
    await expect(demo.locator('[data-result]')).toBeEmpty();
    await demo.getByRole('button', { name: 'Differentiate with C++' }).click();
    await expect(demo.getByRole('status')).toContainText('Complete.');
    await expect(demo.locator('[data-result]')).toContainText('Derivative: (2*x)');
  });
});
