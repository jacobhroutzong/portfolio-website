import { test, expect } from '@playwright/test';

const path = '/labs/scientific-systems/axiom-studio/';
const workerPath = '/scientific-engine.worker.js';

test('ridge pilot runs both WASM engines against the same loss and passes independent checks', async ({ page }, testInfo) => {
  await page.goto('/labs/scientific-systems/');
  await page.getByRole('link', { name: 'Start with the Optimization Lab' }).click();
  await expect(page).toHaveURL(path);
  const pilot = page.getByRole('region', { name: 'Run the fit' });
  const run = pilot.getByRole('button', { name: 'Run both engines' });
  const input = pilot.getByRole('spinbutton', { name: 'Regularization λ' });
  const output = (key: string) => pilot.locator('[data-output="' + key + '"]');
  const symbolic = page.waitForResponse(response => response.url().endsWith('/engines/symbolic.wasm') && response.ok());
  const numerical = page.waitForResponse(response => response.url().endsWith('/engines/numerical.wasm') && response.ok());
  await run.click();
  await Promise.all([symbolic, numerical]);

  const derivativeA = '(((2*((a+(2*b))-3))+((2*(((2*a)+(4*b))-8))*2))+((2*(((3*a)+(6*b))-10))*3))';
  const derivativeB = '((((2*((a+(2*b))-3))*2)+((2*(((2*a)+(4*b))-8))*4))+((2*(((3*a)+(6*b))-10))*6))';

  for (const lambda of [1, 7]) {
    if (lambda !== 1) {
      await input.fill(String(lambda));
      await expect(pilot.locator('[data-ridge-result]')).toBeHidden();
      await run.click();
    }
    await expect(pilot.getByRole('status')).toHaveText('Fit complete. Both checks passed.');
    await expect(output('loss')).toHaveText('(1*a+2*b-3)^2+(2*a+4*b-8)^2+(3*a+6*b-10)^2+' + lambda + '*(a^2+b^2)');
    const aPenalty = lambda === 1 ? '(2*a)' : '(7*(2*a))';
    const bPenalty = lambda === 1 ? '(2*b)' : '(7*(2*b))';
    await expect(output('partialA')).toHaveText('(' + derivativeA + '+' + aPenalty + ')');
    await expect(output('partialB')).toHaveText('(' + derivativeB + '+' + bPenalty + ')');
    await expect(output('system')).toHaveText('[' + (14 + lambda) + ', 28; 28, ' + (56 + lambda) + '] [a; b] = [49; 98]');
    const [a, b] = (await output('fit').innerText()).split(', ').map(Number);
    expect(a).toBeCloseTo(49 / (70 + lambda), 10);
    expect(b).toBeCloseTo(98 / (70 + lambda), 10);
    expect(Number(await output('error').innerText())).toBeLessThanOrEqual(1e-12);
    const residuals = (await output('residuals').innerText()).split(', ').map(Number);
    expect(residuals).toHaveLength(3);
    [3, 8, 10].forEach((target, row) => {
      expect(residuals[row]).toBeCloseTo((row + 1) * (a + 2 * b) - target, 10);
    });
    const gradient = (await output('gradient').innerText()).split(', ').map(Number);
    expect(gradient).toHaveLength(2);
    gradient.forEach(component => expect(Math.abs(component)).toBeLessThanOrEqual(1e-10));
  }

  await expect.poll(() => page.workers().length).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('axiom-studio.png'), fullPage: true, animations: 'disabled' });
});

test('ridge pilot rejects invalid ranges and unsupported fractions, then handles singularity and recovers', async ({ page }) => {
  await page.goto(path);
  const pilot = page.getByRole('region', { name: 'Run the fit' });
  const input = pilot.getByRole('spinbutton', { name: 'Regularization λ' });
  const run = pilot.getByRole('button', { name: 'Run both engines' });
  const status = pilot.getByRole('status');
  const result = pilot.locator('[data-ridge-result]');
  const starts: string[] = [];
  page.on('worker', worker => starts.push(worker.url()));

  for (const invalid of ['', '-1', '0.5', '101']) {
    await input.fill(invalid);
    await run.click();
    await expect(status).toHaveText('Enter a whole number from 0 to 100 for λ.');
    await expect(input).toBeFocused();
    await expect(result).toBeHidden();
  }
  expect(starts).toEqual([]);

  await input.fill('0');
  await run.click();
  await expect(status).toContainText('Exactly singular');
  await expect(status).toContainText('Use λ greater than zero');
  await expect(result).toBeHidden();

  await input.fill('100');
  await run.click();
  await expect(status).toHaveText('Fit complete. Both checks passed.');
  await expect(result).toBeVisible();
});

test('ridge pilot discards cancelled and edited runs and can retry', async ({ page }) => {
  const asset = '**/engines/symbolic.mjs';
  await page.route(asset, () => {});
  await page.goto(path);
  const pilot = page.getByRole('region', { name: 'Run the fit' });
  const run = pilot.getByRole('button', { name: 'Run both engines' });
  const status = pilot.getByRole('status');
  const input = pilot.getByRole('spinbutton', { name: 'Regularization λ' });

  const start = page.waitForRequest(asset);
  await run.click();
  await start;
  await pilot.getByRole('button', { name: 'Cancel fit' }).click();
  await expect(status).toHaveText('Fit cancelled.');
  await expect(run).toBeFocused();
  await expect.poll(() => page.workers().length).toBe(0);

  const restart = page.waitForRequest(asset);
  await run.click();
  await restart;
  await input.fill('4');
  await expect(status).toContainText('λ changed');
  await expect(pilot.locator('[data-ridge-result]')).toBeHidden();
  await expect.poll(() => page.workers().length).toBe(0);

  await page.unroute(asset);
  await run.click();
  await expect(status).toHaveText('Fit complete. Both checks passed.');
});

test('ridge pilot enforces separate worker load and calculation deadlines', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const postMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message: { type: string; kind: string }, ...args: unknown[]) {
      if (message.type === 'run' && message.kind === 'numerical') {
        document.documentElement.dataset.testNumericalRun = 'pending';
        return;
      }
      Reflect.apply(postMessage, this, [message, ...args]);
    };
  });
  const asset = '**/engines/symbolic.mjs';
  await page.route(asset, () => {});
  await page.goto(path);
  const pilot = page.getByRole('region', { name: 'Run the fit' });
  const run = pilot.getByRole('button', { name: 'Run both engines' });
  const status = pilot.getByRole('status');

  const load = page.waitForRequest(asset);
  await run.click();
  await load;
  await page.clock.fastForward(21000);
  await expect(status).toContainText('symbolic engine load timed out');
  await expect.poll(() => page.workers().length).toBe(0);

  await page.unroute(asset);
  await run.click();
  await expect(page.locator('html')).toHaveAttribute('data-test-numerical-run', 'pending');
  await page.clock.fastForward(6000);
  await expect(status).toContainText('numerical engine computation timed out');
  await expect(pilot.locator('[data-ridge-result]')).toBeHidden();
  await expect(run).toBeEnabled();
  await expect.poll(() => page.workers().filter(worker => worker.url().endsWith(workerPath)).length).toBe(0);
});
