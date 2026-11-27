import { expect, test } from '@playwright/test';

const studies = [
  ['equityscout', 'EquityScout'],
  ['lintel', 'Lintel'],
  ['leverline', 'Leverline'],
  ['ascent', 'Ascent'],
  ['decision-intelligence-engine', 'Decision'],
  ['convergence', 'Convergence'],
] as const;

test('Interview Notebook filters saved companies and opens distinct practice exercises', async ({ page }) => {
  await page.goto('/projects/interview-notebook/lab/');
  const company = page.locator('#track-company');
  const category = page.locator('#track-category');
  const scope = page.locator('#track-scope');
  const picker = page.locator('#target-companies');
  const stripeTarget = picker.getByRole('checkbox', { name: 'Stripe', exact: true });
  const exercises = page.locator('#exercise-choices button');
  const companyLinks = page.locator('#prachub-links a');
  const categoryLink = page.locator('#prachub-category');

  await expect(scope).toHaveValue('all');
  await expect(company.locator('option')).toHaveCount(51);
  await expect(company).toHaveValue('Amazon');
  await expect(category).toHaveValue('Coding');
  await expect(companyLinks).toHaveAttribute('href', 'https://prachub.com/companies/amazon');
  await expect(categoryLink).toHaveAttribute('href', 'https://prachub.com/categories/coding-and-algorithms');
  await expect(exercises).toHaveCount(3); // Two originals plus Amazon's published coding sample.

  if (!await stripeTarget.isVisible()) await picker.locator('summary').click();
  await stripeTarget.check();
  await scope.selectOption('targets');
  await expect(company.locator('option')).toHaveText(['Stripe']);
  await expect(companyLinks).toHaveAttribute('href', 'https://prachub.com/interview-guide/stripe-software-engineer-interview-guide');
  await category.selectOption('System design');
  await expect(categoryLink).toHaveAttribute('href', 'https://prachub.com/categories/system-design');
  await expect(exercises).toHaveCount(2);
  const prompts: string[] = [];
  for (const button of await exercises.all()) {
    await button.click();
    const title = await page.locator('#track-drill-name').innerText();
    expect(title.trim()).not.toBe('');
    await expect(button).toContainText(title);
    const prompt = await page.locator('#track-prompt').innerText();
    expect(prompt.trim()).not.toBe('');
    prompts.push(prompt);
    await expect(page.locator('#track-follow li').first()).toBeVisible();
    await page.locator('#track-scoring summary').click();
    await expect(page.locator('#track-rubric li').first()).toBeVisible();
  }
  expect(new Set(prompts).size).toBe(2);

  await page.reload();
  await expect(scope).toHaveValue('targets');
  await expect(company).toHaveValue('Stripe');
  await expect(category).toHaveValue('System design');
  if (!await stripeTarget.isVisible()) await picker.locator('summary').click();
  await expect(stripeTarget).toBeChecked();
  await expect(company.locator('option')).toHaveText(['Stripe']);
  await stripeTarget.uncheck();
  await expect(scope).toHaveValue('all');
  await expect(company.locator('option')).toHaveCount(51);
});

test('Interview Notebook links company coding practice and searches its directory', async ({ page }) => {
  await page.goto('/projects/interview-notebook/lab/');
  const company = page.locator('#track-company');
  const category = page.locator('#track-category');
  const exercises = page.locator('#exercise-choices button');

  await company.selectOption('Delta Air Lines');
  for (const interviewCategory of ['Coding', 'System design', 'Other']) {
    await category.selectOption(interviewCategory);
    await expect(exercises).toHaveCount(2);
  }
  await category.selectOption('Behavioral');
  await expect(exercises).toHaveCount(3);
  await exercises.filter({ hasText: /why delta/i }).click();
  await expect(page.locator('#track-origin a')).toHaveAttribute('href', 'https://www.delta.com/us/en/careers/corporate-careers');

  await company.selectOption('NVIDIA');
  await expect(page.locator('#community-practice')).toBeHidden();
  await category.selectOption('Coding');
  const resources = page.locator('#community-company');
  await expect(resources.locator('a[href*="github.com/liquidslr/leetcode-company-wise-problems/"]')).toBeVisible();
  await expect(resources.locator('a[href*="github.com/ombharatiya/FAANG-Coding-Interview-Questions"]')).toBeVisible();
  await expect(resources.locator('a[href="https://leetcodewizard.io/problem-database"]')).toBeVisible();
  await expect(page.locator('#community-picks a[href^="https://leetcode.com/problems/"]').first()).toBeVisible();

  await page.locator('#nav-find').click();
  const search = page.locator('#directory-search');
  const results = page.locator('#directory-results');
  const initiallyVisible = await results.locator('a').count();
  expect(initiallyVisible).toBeGreaterThan(0);
  await page.locator('#directory-more').click();
  expect(await results.locator('a').count()).toBeGreaterThan(initiallyVisible);
  for (const query of ['Adobe', 'aDoB']) {
    await search.fill(query);
    await expect(results.locator('a[href*="github.com/liquidslr/leetcode-company-wise-problems/"][href*="Adobe"]')).toBeVisible();
  }
  await search.fill('zz-no-company-matches');
  await expect(results.locator('a')).toHaveCount(0);
  await expect(page.locator('#directory-count')).toContainText(/no matching/i);
});

test('commercial projects remain navigable as static case studies', async ({ page }) => {
  await page.goto('/projects/');
  for (const [slug, title] of studies) {
    await expect(page.locator('main').locator('a[href="/projects/' + slug + '/"]')).toHaveCount(1);
    const result = await page.request.get('/projects/' + slug + '/');
    expect(result.status()).toBe(200);
    const html = await result.text();
    expect(html).toContain(title);
    expect(html).toContain('/media/showcase/' + slug + '.svg');
    expect(html).not.toMatch(/<iframe|href="\/downloads\/|src="\/apps\/(?:lintel|leverline)\//);
  }
});


test('Apex and Decision are startups and Interview Notebook keeps its full title', async ({ page }) => {
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const root = route === '/' ? page.locator('#projects') : page.locator('main');
    const startups = root.locator('section.project-group').filter({
      has: page.getByRole('heading', { name: 'Businesses + Startups' }),
    });
    const research = root.locator('section.project-group').filter({
      has: page.getByRole('heading', { name: 'Research + Fun Projects' }),
    });
    for (const slug of ['career-intelligence-aviation', 'decision-intelligence-engine']) {
      await expect(startups.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(1);
      await expect(research.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(0);
    }
    const titles = await root.locator('.selected-card h3, .selected-card h4, .project-card h3').allTextContents();
    expect(titles.filter(title => title.trim() === 'Interview Notebook')).toHaveLength(1);
    for (const title of titles.map(title => title.trim()).filter(title => title !== 'Interview Notebook')) {
      expect(title).toMatch(/^\S+$/u);
    }
  }
});

test('Marqyra appears once in Businesses + Startups and links to the owner-only workspace', async ({ page }) => {
  const path = '/projects/marqyra/';
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const listing = route === '/' ? page.locator('#projects') : page.getByRole('main');
    const card = listing.getByRole('link', { name: 'Explore Marqyra →' });
    await expect(listing.locator('a[href="' + path + '"]')).toHaveCount(1);
    await expect(listing.getByRole('region', { name: 'Businesses + Startups' }).getByRole('link', { name: 'Explore Marqyra →' })).toHaveCount(1);
    await card.click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { name: 'Marqyra', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Marqyra (owner-only)' }))
      .toHaveAttribute('href', 'https://marqyra.jacobroutzong.dev/');
    await expect(page.locator('main iframe, main a[href*="github.com/jacobhroutzong/marqyra"]')).toHaveCount(0);
  }
});

test('Muster has one Research + Fun Projects card and a public app link', async ({ page }) => {
  const path = '/projects/muster/';
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const card = page.locator('article.selected-card').filter({
      has: page.getByRole('heading', { name: 'Muster', exact: true }),
    });
    await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Research + Fun Projects' }).locator(card)).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Businesses + Startups' }).locator(card)).toHaveCount(0);
    await expect(card).toContainText('A public research workspace');
    await card.getByRole('link', { name: 'Explore Muster →' }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { name: 'Muster', level: 1 })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Explore National Guard AGR jobs by state on Muster', exact: true }))
    .toHaveAttribute('href', 'https://muster.jacobroutzong.dev/');
  await expect(page.getByText('No sign-in required.', { exact: false })).toBeVisible();
  await expect(page.locator('iframe, #muster-data')).toHaveCount(0);
});

test('Empirava is the single flagship listing and supports keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  if (await toggle.isVisible()) {
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work' }).press('Enter');
  await expect(page).toHaveURL('/projects/');

  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const projects = route === '/' ? page.locator('#projects') : page.getByRole('main');
    await expect(projects.locator('a[href="/projects/empirava/"]')).toHaveCount(1);
    const flagship = projects.getByRole('link', { name: /Explore Empirava/ });
    // Older projects may move behind the group disclosure as new projects are added.
    if (!await flagship.isVisible()) {
      const group = projects.getByRole('region', { name: 'Research + Fun Projects' });
      const more = group.getByRole('button', { name: /Show \d+ more projects?/ });
      await more.press('Enter');
      await expect(group.locator('.project-toggle')).toHaveAttribute('aria-expanded', 'true');
    }
    await expect(flagship).toBeVisible();
    for (const slug of ['tunera', 'causarium', 'recursa', 'harness2-lab']) {
      await expect(projects.locator('a[href="/projects/' + slug + '/"]')).toHaveCount(0);
    }
    await flagship.press('Enter');
    await expect(page).toHaveURL('/projects/empirava/');
    await expect(page.getByRole('heading', { name: 'Empirava', level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/projects\/empirava\/$/);
    await expect(page.getByRole('link', { name: 'Open the protected Empirava preview' }))
      .toHaveAttribute('href', 'https://empirava.jacobroutzong.dev/');
    expect(await page.locator('html').evaluate(root => root.scrollWidth <= root.clientWidth)).toBe(true);
  }

  await page.goto('/projects/tunera/');
  await page.getByRole('link', { name: /Explore Empirava/ }).press('Enter');
  await expect(page).toHaveURL('/projects/empirava/');
  await page.getByRole('link', { name: 'Recursa research case study' }).press('Enter');
  await expect(page).toHaveURL('/projects/recursa/');
});

test('historical Recursa Studio retains its two navigable research areas', async ({ page }) => {
  await page.goto('/projects/recursa/');
  await expect(page.getByRole('heading', { name: 'Recursa', level: 1 })).toBeVisible();
  for (const name of ['Application Synthesis', 'Agent Optimization']) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }
  const areas = page.getByRole('navigation', { name: 'Recursa Studio research areas' });
  const replay = areas.getByRole('link', { name: 'Open Application Synthesis replay' });
  await replay.press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/studio\/(?:#overview)?$/);
  await expect(page.getByRole('heading', { name: 'Recursa Studio', level: 1 })).toBeVisible();
  for (const name of ['Application Synthesis', 'Agent Optimization']) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Browse specifications' }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/studio\/#playground$/);
  await expect(page.locator('#preset-list button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Benchmarks' }).press('Enter');
  await expect(page.locator('#series-results')).toBeVisible();

  await page.goto('/projects/recursa/');
  const runtimeRequests: string[] = [];
  page.on('request', request => {
    if (/\/api\/harness2-lab\/|harness2-lab\.hf\.space/.test(request.url())) {
      runtimeRequests.push(request.url());
    }
  });
  await areas.getByRole('link', { name: 'Open Agent Optimization archive' }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/harness2-lab\/$/);
  await expect(page.getByRole('heading', { name: 'Harness² Lab research archive', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Setup instructions and source' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recorded simulator data' })).toBeVisible();
  expect(runtimeRequests).toEqual([]);
  await page.getByRole('link', { name: /Recursa Studio/ }).press('Enter');
  await expect(page).toHaveURL(/\/projects\/recursa\/#agent-optimization$/);
});

test('Axiom Studio is listed and Q-SPECTRA remains an independent case study', async ({ page }) => {
  const optimization = '/labs/scientific-systems/axiom-studio/';
  const quantum = '/projects/q-spectra/';
  for (const listing of ['/', '/projects/']) {
    await page.goto(listing);
    const research = page.getByRole('region', { name: 'Research + Fun Projects' });
    await research.getByRole('button', { name: /Show \d+ more projects/ }).click();
    const selected = page.locator('article.selected-card');
    const axiom = selected.filter({ has: page.getByRole('heading', { name: 'Axiom', exact: true }) });
    await expect(axiom).toHaveCount(1);
    await expect(selected.filter({ hasText: 'Scientific Systems Lab' })).toHaveCount(0);
    await expect(selected.locator('a[href="' + quantum + '"]')).toHaveCount(0);
    const start = axiom.getByRole('link', { name: 'Explore Axiom →' });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute('href', optimization);
    await start.click();
    await expect(page).toHaveURL(optimization);
  }

  await page.goto('/projects/');
  await page.getByRole('link', { name: /Q-SPECTRA/ }).click();
  await expect(page).toHaveURL(quantum);
  await expect(page.getByRole('heading', { name: 'Explore the simulations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Live demo' })).toHaveAttribute('href', 'https://qspectra.jacobroutzong.dev/');
  await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/jacobhroutzong/q-spectra-17e-workbench');
});


test('Fieldsense links its research case study and recorded lab in both directions', async ({ page }) => {
  for (const route of ['/', '/projects/']) {
    await page.goto(route);
    const card = page.locator('article.selected-card').filter({
      has: page.getByRole('heading', { name: 'Fieldsense', exact: true }),
    });
    await expect(card).toHaveCount(1);
    await card.getByRole('link', { name: 'Explore Fieldsense →' }).click();
    await expect(page).toHaveURL('/projects/fieldsense/');
    await expect(page.getByRole('heading', { name: 'Fieldsense', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Live demo' }))
      .toHaveAttribute('href', 'https://fieldsense.jacobroutzong.dev/');
  }
  await expect(page.getByRole('link', { name: 'Open the animated Fieldsense lab' })).toHaveAttribute('href', 'https://fieldsense.jacobroutzong.dev/');
  // The custom hostname is provisioned in Cloudflare; local CI validates the existing lab route.
  await page.goto('/projects/fieldsense/lab/');
  await expect(page.locator('#fieldsense-app')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('combobox', { name: 'Scenario' }).selectOption('strict_limit');
  await expect(page.getByRole('heading', { name: 'No feasible allocation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Project overview' }))
    .toHaveAttribute('href', 'https://jacobroutzong.dev/projects/fieldsense/');
});
