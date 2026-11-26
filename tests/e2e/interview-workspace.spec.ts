import { expect, test } from '@playwright/test';

const lab = '/projects/interview-notebook/lab/';
const amazonAnswer = `function solve({parts, prefix, k}) {
  return parts.filter(([name]) => name.startsWith(prefix))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, k).map(([name]) => name);
}`;

test('grade JavaScript from the tracker, keep drafts, and recover from a stopped run', async ({ page }) => {
  await page.goto(lab);
  await page.locator('#track-solve').click();
  await expect(page.locator('#ws-problem')).toHaveValue('amazon-part-search');
  const language = page.locator('#ws-language');
  const editor = page.locator('#ws-code');
  const status = page.locator('#ws-status');
  await language.selectOption('javascript');
  await editor.fill('function solve() { return null; }');
  await page.locator('#ws-submit').click();
  await expect(page.locator('#ws-results')).toContainText(/fail|incorrect|mismatch/i);
  await editor.fill(amazonAnswer);
  await page.locator('#ws-submit').click();
  await expect(page.locator('#ws-progress')).toContainText(/solved/i);
  await page.reload();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(editor).toHaveValue(amazonAnswer);
  await expect(page.locator('#ws-progress')).toContainText(/solved/i);

  await page.locator('#ws-mode').selectOption('custom');
  await page.locator('#ws-input').fill('{"parts":[["washer",2],["wrench",4]],"prefix":"w","k":1}');
  await page.locator('#ws-run').click();
  await expect(page.locator('#ws-results')).toContainText('wrench');
  await editor.fill('function solve() { while (true) {} }');
  await page.locator('#ws-run').click();
  await page.locator('#ws-stop').click();
  await expect(status).toContainText(/stop|cancel/i);
  await editor.fill(amazonAnswer);
  await page.locator('#ws-run').click();
  await expect(page.locator('#ws-results')).toContainText('wrench');
});

test('execute Python against the row-norm cases and SQLite against fresh fixtures', async ({ page }) => {
  await page.goto(lab + '#workspace');
  const problem = page.locator('#ws-problem');
  const editor = page.locator('#ws-code');
  await problem.selectOption('anthropic-row-norms');
  await page.locator('#ws-language').selectOption('python');
  await editor.fill('def solve(rows):\n    return [sum(x * x for x in row) for row in rows]');
  await page.locator('#ws-submit').click();
  await expect(page.locator('#ws-progress')).toContainText(/solved/i, { timeout: 45000 });
  await problem.selectOption('intuit-unbalanced-ledger');
  await expect(page.locator('#ws-language')).toHaveValue('sql');
  await editor.fill("SELECT entry_id, SUM(CASE WHEN side = 'debit' THEN cents ELSE -cents END) AS net FROM postings GROUP BY entry_id HAVING net <> 0 ORDER BY entry_id");
  await page.locator('#ws-submit').click();
  await expect(page.locator('#ws-progress')).toContainText(/solved/i, { timeout: 30000 });
});

test('terminate an unresponsive solution and keep the next execution usable', async ({ page }) => {
  await page.goto(lab + '#workspace');
  await page.locator('#ws-problem').selectOption('amazon-part-search');
  await page.locator('#ws-language').selectOption('javascript');
  await page.locator('#ws-code').fill('function solve() { while (true) {} }');
  await page.locator('#ws-run').click();
  await expect(page.locator('#ws-status')).toContainText(/time limit|timed out|timeout/i, { timeout: 30000 });
  await page.locator('#ws-code').fill(amazonAnswer);
  await page.locator('#ws-submit').click();
  await expect(page.locator('#ws-progress')).toContainText(/solved/i);
});
