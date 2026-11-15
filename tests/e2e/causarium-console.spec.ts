import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const evidence = JSON.parse(readFileSync('public/media/causarium/evidence-v1.json', 'utf8'));
const label = (n: number, digits: number) => (n < 0 ? '−' : n > 0 ? '+' : '') + Math.abs(n).toFixed(digits);

test('site choices expose measured cells and expert precision', async ({ page }) => {
  await page.goto('/projects/causarium/');
  await page.getByRole('link', {name: 'Open research console'}).click();
  await expect(page.getByRole('heading', {name:'Causarium.'})).toBeVisible();
  await page.getByLabel('Prompt comparison').selectOption('1');
  await page.getByLabel('Layer', {exact:true}).selectOption('5');
  await page.getByLabel('Token position').selectOption('4');
  const explore = page.getByRole('tabpanel', { name:'Explore Activations' });
  const row = evidence.pythia.selective.rows[1];
  const selected = explore.getByRole('button', { name:/Layer 5, position 4 is, change/ });
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  for (const [layer, scores] of row.matrix.entries()) {
    for (const [position, score] of scores.entries()) {
      await expect(explore.getByRole('button', { name:new RegExp(`^Layer ${layer}, position ${position} .+, change`) })).toHaveText(label(score.delta, 3));
    }
  }
  await page.getByLabel('Map value').selectOption('margin');
  await expect(explore.getByRole('button', { name:/Layer 5, position 4 is, patched margin/ })).toHaveText(label(row.matrix[5][4].margin, 3));
  const site = explore.getByRole('button', { name:/Layer 5, position 4 is, patched margin/ });
  await site.focus();
  await site.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Token position')).toHaveValue('3');
  await page.getByRole('button', {name:'Expert'}).click();
  const readout = explore.getByRole('complementary', {name:'France → Germany selected intervention'});
  await expect(readout.getByText('Exact delta', {exact:true})).toBeVisible();
  await expect(readout.locator('[data-output="delta-exact"]')).toHaveText(String(row.matrix[5][3].delta));
  await explore.getByText('M3 donor controls · layer 1, country token', {exact:true}).filter({visible:true}).click();
  await expect(explore.getByRole('rowheader', {name:'Alice · name'})).toBeVisible();
});

test('keyboard tabs, mode and bidirectional checkpoint controls preserve evidence', async ({ page }) => {
  await page.goto('/projects/causarium/lab/');
  const explore = page.getByRole('tab', {name:'Explore Activations'});
  await expect(explore).toBeVisible();
  expect(await page.getByRole('tablist').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await explore.focus();
  await explore.press('ArrowRight');
  const compare = page.getByRole('tab', {name:'Compare Checkpoints'});
  await expect(compare).toBeFocused();
  await expect(compare).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Arithmetic example').selectOption('1');
  await page.getByLabel('Swap direction').selectOption('adapted');
  const readout = page.getByRole('complementary', {name:'Arithmetic B Base → adapted readout'});
  await expect(readout.getByText(label(evidence.qwen.rows[1].adaptedRecipient[1].delta, 4), {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Expert'}).click();
  await expect(readout.getByText('Activation L2 distance')).toBeVisible();
  await page.getByRole('button', {name:'Guided'}).click();
  await expect(readout.getByText('Activation L2 distance')).toBeHidden();
  await page.getByText('Exact candidate logits and control table', {exact:true}).filter({visible:true}).click();
  await expect(page.getByRole('table', {name:'Arithmetic B · Base → adapted · candidate logits'})).toBeVisible();
  await compare.focus();
  await compare.press('End');
  await expect(page.getByRole('tab', { name:'Understand Results' })).toBeFocused();
  await page.getByText('Recovery', {exact:true}).click();
  await expect(page.getByText(/undefined at a zero denominator/)).toBeVisible();
  await expect(page.getByRole('link', {name:/Pinned revisions, run commands/})).toHaveAttribute('href', '/projects/causarium/#provenance');
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test.describe('static console', () => {
  test.use({javaScriptEnabled:false});
  test('recorded displays, alternatives and sources work without script', async ({ page }) => {
    await page.goto('/projects/causarium/lab/');
    await expect(page.getByRole('link', {name:'Compare Checkpoints',exact:true})).toBeVisible();
    await expect(page.getByRole('table', {name:'France → Germany heatmap, logit values'})).toBeVisible();
    await expect(page.getByRole('button', {name:'Expert'})).toBeHidden();
    await page.getByText('Exact layer and position table', {exact:true}).first().press('Enter');
    await expect(page.getByRole('table', {name:'France → Italy · recorded logit margins'})).toBeVisible();
    await expect(page.getByRole('link', {name:'Evidence v1 JSON',exact:true})).toHaveAttribute('href', '/media/causarium/evidence-v1.json');
    expect(/tunera-private|prompt_ids|raw_logs|checkpoint_file|\b[A-Z]:\\/i.test(await page.content())).toBe(false);
  });
});
