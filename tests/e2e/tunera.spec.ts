import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const fixture = JSON.parse(readFileSync(new URL('../../public/apps/crucible/fixture.json', import.meta.url), 'utf8'));

test('Tunera guides scoring and preserves historical report details', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (/(^|\.)(hf\.space|huggingface\.co)$/.test(new URL(request.url()).hostname)) external.push(request.url());
  });
  await page.route('**/api/crucible/evaluate', async route => {
    const input = route.request().postDataJSON();
    expect(input.cases).toEqual(fixture.cases);
    expect(input.predictions).toEqual(fixture.predictions);
    await route.fulfill({ status: 201, json: { ...fixture.runs[0], id: 'test-run', label: input.label } });
  });
  await page.route('**/api/tunera', async route => {
    const input = route.request().postDataJSON();
    if (input.action === 'validate') {
      expect(input.cases.split('\n')).toHaveLength(13);
      expect(JSON.parse(input.cases.split('\n').at(-1)).messages[0].content).toBe('A new user question');
      await route.fulfill({ json: { rows: 13, valid: true } });
      return;
    }
    expect(input).toEqual({ action: 'plan', size: '4B', context: 512, rank: 16, steps: 100 });
    await route.fulfill({ json: { config: { model_id: 'Qwen/Qwen3-4B', rank: 16 } } });
  });
  await page.goto('/projects/tunera/');
  const model = page.getByLabel('Model and training strategy');
  await expect(model).toHaveValue('4B');
  await page.getByRole('button', { name: 'Build plan' }).click();
  await expect(page.getByLabel('Experiment plan', { exact: true })).toContainText('Qwen/Qwen3-4B');
  await model.selectOption('qwen35');
  await page.getByRole('button', { name: 'Build plan' }).click();
  const config = JSON.parse(await page.getByLabel('Experiment plan', { exact: true }).textContent() ?? '{}');
  expect(config.config).toMatchObject({ model_id: 'Qwen/Qwen3.5-2B', rank: 8, max_length: 256 });
  expect(config.experimental).toBe(true);
  await page.getByText('Validate a dataset', { exact: true }).click();
  await page.getByLabel('New user message').fill('A new user question');
  await page.getByLabel('Expected assistant reply').fill('An expected reply');
  await page.getByRole('button', { name: 'Add conversation' }).click();
  await page.getByRole('button', { name: 'Validate dataset' }).click();
  await expect(page.getByText('13 conversations passed validation.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Evaluation Lab' })).toBeVisible();
  await page.getByRole('button', { name: 'Load worked example' }).click();
  const lab = page.locator('#evaluation-lab');
  await lab.getByRole('button', { name: 'Score responses', exact: true }).click();
  await expect(lab.getByText('Scored and saved in this browser.')).toBeVisible();
  await lab.getByLabel('Compare with').selectOption({ label: fixture.runs[0].label });
  await expect(lab.getByText(/Case hashes and IDs match/)).toBeVisible();
  await lab.getByText('Inspect expected and actual responses').click();
  await expect(lab.getByText(/semantic_mismatch/)).toBeVisible();
  const download = page.waitForEvent('download');
  await lab.getByRole('button', { name: 'Export selected report' }).click();
  expect((await download).suggestedFilename()).toBe('tunera-tool-use-report.json');
  const distinct = { ...fixture.runs[0], label: 'Different case set', sha256: { ...fixture.runs[0].sha256, cases: 'b'.repeat(64) } };
  await lab.getByLabel('Import Crucible report').setInputFiles({
    name: 'report.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(distinct)),
  });
  await lab.getByLabel('Compare with').selectOption({ label: fixture.runs[0].label });
  await expect(lab.getByText(/without deltas/)).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
