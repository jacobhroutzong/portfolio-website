import { test, expect } from '@playwright/test';

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const { kind, action, field, label, value } of [
    { kind: 'numerical', action: 'Solve with C++', field: 'order', label: 'Matrix order', value: '3' },
    { kind: 'symbolic', action: 'Differentiate with C++', field: 'expression', label: 'Expression', value: '42*x' },
  ]) {
    test(`${kind} inputs cannot submit through the browser`, async ({ page }) => {
      const path = `/labs/scientific-systems/${kind}/`;
      const submissions: string[] = [];
      await page.route(url => url.pathname === path && url.searchParams.has(field), async route => {
        submissions.push(route.request().url());
        await route.fulfill({ body: 'Intercepted form submission' });
      });
      await page.goto(path);
      const input = page.getByRole(kind === 'numerical' ? 'spinbutton' : 'textbox', { name: label, exact: true });
      await input.fill(value);
      await expect(page.getByRole('button', { name: action })).toBeDisabled();
      await input.press('Enter');
      await expect(page).toHaveURL(url => url.pathname === path && url.search === '');
      await expect(input).toHaveValue(value);
      expect(submissions).toEqual([]);
    });
  }
});

test('C++ matrix worker solves, rejects singular matrices, resets and recovers', async ({ page }) => {
  await page.goto('/labs/scientific-systems/numerical/');
  const demo = page.locator('.cpp-demo');
  await demo.getByRole('button', { name: 'Solve with C++' }).click();
  await expect(demo.getByRole('status')).toContainText('Complete. Computed by the C++ engine.');
  const values = (await demo.locator('[data-primary]').innerText()).trim().split(/\s+/).map(Number);
  const expected = [1, -1, 2, 3];
  expect(values).toHaveLength(expected.length);
  values.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 12));
  await demo.getByText('Engine details', { exact: true }).click();
  await expect(demo.locator('[data-result]')).toBeVisible();
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
  await expect(demo.locator('[data-primary]')).toHaveText('((3*(x^2))+2)');
  await demo.locator('[name=expression]').fill('x^0'); await run.click();
  await expect(demo.locator('[data-primary]')).toHaveText('0');
  await expect(demo.locator('[data-conditions]')).toHaveText('x ≠ 0');
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

test('editing or choosing an example invalidates the result and preserves custom calculation', async ({ page }) => {
  await page.goto('/labs/scientific-systems/numerical/');
  const demo = page.locator('.cpp-demo');
  const run = demo.getByRole('button', { name: 'Solve with C++' });
  const panel = demo.getByRole('region', { name: 'Solution X', exact: true }).first();
  await demo.getByRole('button', { name: 'Needs pivoting' }).click();
  await expect(demo.getByRole('spinbutton', { name: 'Matrix order', exact: true })).toHaveValue('3');
  await run.click();
  await expect(panel).toBeVisible();
  await demo.getByRole('button', { name: 'Exactly singular' }).click();
  await expect(panel).toBeHidden();
  await run.click();
  await expect(demo.getByRole('status')).toContainText('Exactly singular');
  await demo.getByRole('textbox', { name: 'Matrix A', exact: true }).fill('1 0\n0 1');
  await demo.getByRole('textbox', { name: 'Matrix B', exact: true }).fill('42\n-17');
  await run.click();
  await expect(demo.locator('[data-primary]')).toHaveText('42 -17');
  await demo.getByRole('textbox', { name: 'Matrix B', exact: true }).fill('1\nNaN');
  await expect(panel).toBeHidden();
  await run.click();
  await expect(demo.getByRole('status')).toContainText('Matrix B, row 2, column 1');
});

test('editing during worker load discards the in-flight request and allows retry', async ({ page }) => {
  const engine = '**/engines/symbolic.mjs';
  await page.route(engine, () => {});
  await page.goto('/labs/scientific-systems/symbolic/');
  const demo = page.locator('.cpp-demo');
  const run = demo.getByRole('button', { name: 'Differentiate with C++' });
  const request = page.waitForRequest(engine);
  await run.click();
  await request;
  await expect(run).toBeDisabled();
  await demo.getByRole('button', { name: 'Zero power' }).press('Enter');
  await expect(demo.getByRole('textbox', { name: 'Expression', exact: true })).toHaveValue('x^0');
  await expect(demo.getByRole('status')).toContainText('Inputs changed');
  await expect(demo.locator('[data-panel]')).toBeHidden();
  await expect(run).toBeEnabled();
  await page.unroute(engine);
  await run.click();
  await expect(demo.locator('[data-primary]')).toHaveText('0');
  await expect(demo.locator('[data-conditions]')).toHaveText('x ≠ 0');
});
