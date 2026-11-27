/* Browser entry point for the Interview Notebook code workspace. */
(() => {
  'use strict';

  const languageNames = {python: 'Python', javascript: 'JavaScript', sql: 'SQL'};
  const starters = {
    python: 'def solve(data):\n    # Return your result here.\n    pass\n',
    javascript: 'function solve(data) {\n  // Return your result here.\n}\n',
    sql: '-- Write your SELECT query here.\n',
  };
  const storagePrefix = 'interview-notebook:workspace:v1:';
  const memory = new Map();
  const problems = window.NotebookProblems;
  const root = document.getElementById('workspace');
  if (!root || !Array.isArray(problems) || !problems.length) return;

  root.setAttribute('aria-labelledby', 'ws-heading');
  root.innerHTML = `
    <div class="intro">
      <h1 id="ws-heading" tabindex="-1">Coding workspace</h1>
      <p id="ws-intro"></p>
    </div>
    <div class="ws-layout">
      <article class="ws-brief">
        <div class="ws-brief-head">
          <label class="field-label" for="ws-problem">Exercise</label>
          <select id="ws-problem"></select>
        </div>
        <div class="ws-brief-body">
          <p class="kicker" id="ws-company"></p>
          <h2 id="ws-title"></h2>
          <p id="ws-contract"></p>
          <p id="ws-origin" class="small"></p>
          <button type="button" class="ws-editor-jump" id="ws-jump">Go to editor ↓</button>
          <p id="ws-fixture" hidden></p>
          <div class="ws-example">
            <h3>Worked example</h3>
            <p class="ws-code-label">Input</p><pre id="ws-example-input"></pre>
            <p class="ws-code-label">Expected output</p><pre id="ws-example-output"></pre>
          </div>
          <details id="ws-explanation" class="ws-disclosure" hidden>
            <summary>Solution approach</summary><p id="ws-approach"></p>
          </details>
        </div>
      </article>
      <div class="ws-work">
        <section class="ws-editor" aria-labelledby="ws-editor-heading">
          <div class="ws-editor-head">
            <h2 id="ws-editor-heading"><label for="ws-code">Your solution</label></h2>
            <label class="ws-language-label" for="ws-language">Language <select id="ws-language"></select></label>
          </div>
          <textarea id="ws-code" rows="11" spellcheck="false" autocomplete="off" autocapitalize="off" maxlength="32768" aria-describedby="ws-signature"></textarea>
          <p id="ws-signature" class="small"></p>
          <div class="ws-test-controls">
            <label class="field-label" for="ws-mode">Test input</label>
            <select id="ws-mode"><option value="example">Worked example</option><option value="custom">Custom JSON</option></select>
          </div>
          <div id="ws-custom" hidden>
            <label class="field-label" for="ws-input">Custom JSON input</label>
            <textarea id="ws-input" rows="4" maxlength="32768" spellcheck="false" autocapitalize="off"></textarea>
          </div>
          <div class="ws-actions">
            <button class="btn secondary" type="button" id="ws-run">Run example</button>
            <button class="btn" type="button" id="ws-submit">Submit tests</button>
            <button class="btn secondary" type="button" id="ws-stop" hidden>Stop run</button>
          </div>
        </section>
        <section class="ws-feedback" aria-labelledby="ws-feedback-heading">
          <div class="ws-feedback-head">
            <h2 id="ws-feedback-heading">Results</h2><div id="ws-progress"></div>
          </div>
          <p id="ws-status" role="status" aria-live="polite"></p>
          <div id="ws-results"></div>
          <details id="ws-history" class="ws-disclosure" hidden>
            <summary>Recent submissions</summary><ol id="ws-history-list"></ol>
          </details>
          <p id="ws-save-note" class="small" hidden>Drafts and results are available for this visit only. Browser storage is unavailable.</p>
        </section>
      </div>
    </div>`;

  const el = id => document.getElementById('ws-' + id);
  const code = el('code');
  const problemPicker = el('problem');
  const languagePicker = el('language');
  const status = el('status');
  const results = el('results');
  let problem;
  let language;
  let record;
  let active;
  let storageAvailable = true;

  const tracker = document.getElementById('tracker-data');
  const exerciseSources = new Map();
  if (tracker) {
    const {sources, matched, practiceSets} = JSON.parse(tracker.textContent);
    for (const [company, categories] of Object.entries(practiceSets)) {
      for (const exercises of Object.values(categories)) {
        for (const exercise of exercises) {
          if (exercise.context) exerciseSources.set(company + '/' + exercise.title, {
            label: exercise.context.label, url: exercise.context.url, prefix: 'Original practice · ',
          });
        }
      }
    }
    for (const example of matched) {
      const source = sources.find(item => item.kind === 'named' && item.company === example.company &&
        item.sourceLabel === example.sourceLabel && item.category === example.category);
      if (source) exerciseSources.set(example.company + '/' + example.title, {
        label: source.sourceLabel, url: source.sourceUrl, prefix: 'Adapted from an employer example · ',
      });
    }
  }

  function read(key) {
    if (memory.has(key)) return memory.get(key);
    if (!storageAvailable) return null;
    try {
      const value = JSON.parse(localStorage.getItem(storagePrefix + key));
      if (value !== null) memory.set(key, value);
      return value;
    } catch {
      return null;
    }
  }

  function write(key, value) {
    memory.set(key, value);
    if (!storageAvailable) return;
    try {
      localStorage.setItem(storagePrefix + key, JSON.stringify(value));
    } catch {
      storageAvailable = false;
      el('save-note').hidden = false;
    }
  }

  function recordKey() {
    return problem.id + '/' + language;
  }

  function save() {
    write(recordKey(), record);
  }

  function resultValue(value) {
    if (value === undefined) return '(no value returned)';
    const compact = JSON.stringify(value);
    return compact.length <= 90 ? compact : JSON.stringify(value, null, 2);
  }

  function equalJSON(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equalJSON(a[key], b[key]));
  }

  function showProgress() {
    const count = record.submissions;
    const progress = el('progress');
    progress.textContent = (record.solved ? 'Solved' : count ? 'Practicing' : 'Unsubmitted') +
      ' · ' + count + (count === 1 ? ' submission' : ' submissions');
    progress.classList.toggle('ws-solved', record.solved);
    el('explanation').hidden = !record.attempted;
    el('history').hidden = !record.history.length;
    const list = el('history-list');
    list.replaceChildren();
    for (const submission of record.history) {
      const item = document.createElement('li');
      const time = new Date(submission.at);
      const timestamp = Number.isFinite(time.getTime()) ? time.toLocaleString() : '';
      item.textContent = [timestamp, submission.summary].filter(Boolean).join(' · ');
      list.append(item);
    }
  }

  function setBusy(busy) {
    el('stop').hidden = !busy;
    el('run').disabled = busy;
    el('submit').disabled = busy;
    results.setAttribute('aria-busy', String(busy));
  }

  function cancel(message) {
    if (!active) return;
    const previous = active;
    active = null;
    previous.abort();
    setBusy(false);
    status.textContent = message;
  }

  function chooseLanguage(nextLanguage) {
    cancel('Run stopped.');
    language = nextLanguage;
    languagePicker.value = language;
    const stored = read(recordKey());
    record = {
      code: typeof stored?.code === 'string' ? stored.code : starters[language],
      custom: typeof stored?.custom === 'string' ? stored.custom : JSON.stringify(problem.cases[0].input, null, 2),
      mode: stored?.mode === 'custom' ? 'custom' : 'example',
      attempted: stored?.attempted === true,
      solved: stored?.solved === true,
      submissions: Number.isSafeInteger(stored?.submissions) && stored.submissions >= 0 ? stored.submissions : 0,
      history: Array.isArray(stored?.history) ? stored.history.filter(entry => entry && typeof entry.summary === 'string' && typeof entry.at === 'string').slice(0, 10) : [],
    };
    code.value = record.code;
    el('input').value = record.custom;
    el('mode').value = record.mode;
    updateMode();
    el('signature').textContent = language === 'sql'
      ? 'Return one result set, with columns and rows in the order specified.'
      : 'Implement solve(data) and return a JSON-compatible value.';
    status.textContent = record.history.length
      ? 'Last submission · ' + record.history[0].summary
      : 'Run the example to check your solution.';
    results.replaceChildren();
    el('explanation').open = false;
    el('history').open = false;
    showProgress();
    write('selection', {id: problem.id, language});
  }

  function selectProblem(challenge, preferredLanguage) {
    problem = challenge;
    problemPicker.value = challenge.id;
    el('company').textContent = challenge.company + ' · ' + challenge.category;
    el('title').textContent = challenge.title;
    el('contract').textContent = challenge.contract;
    const origin = el('origin');
    const source = exerciseSources.get(challenge.company + '/' + challenge.title);
    origin.textContent = source?.prefix || 'Original company-themed practice';
    if (source && /^https:\/\//.test(source.url)) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      origin.append(link);
    }
    el('fixture').textContent = challenge.fixture || '';
    el('fixture').hidden = !challenge.fixture;
    el('example-input').textContent = resultValue(challenge.cases[0].input);
    el('example-output').textContent = resultValue(challenge.cases[0].expected);
    el('approach').textContent = challenge.explanation;
    languagePicker.replaceChildren(...challenge.languages.map(id => new Option(languageNames[id], id)));
    chooseLanguage(challenge.languages.includes(preferredLanguage) ? preferredLanguage : challenge.languages[0]);
  }

  function updateMode() {
    const custom = el('mode').value === 'custom';
    el('custom').hidden = !custom;
    el('run').textContent = custom ? 'Run custom input' : 'Run example';
  }

  function appendValue(parent, label, value) {
    const caption = document.createElement('dt');
    caption.textContent = label;
    const content = document.createElement('dd');
    const pre = document.createElement('pre');
    pre.textContent = value;
    content.append(pre);
    parent.append(caption, content);
  }

  function showCase(source, result, graded, index) {
    const error = typeof result?.error === 'string' ? result.error : result?.error ? String(result.error) : '';
    const hasValue = Boolean(result && Object.hasOwn(result, 'actual') && result.actual !== undefined);
    const passed = !error && hasValue && (!graded || equalJSON(result.actual, source.expected));
    const row = document.createElement('details');
    row.className = 'ws-case ' + (passed ? 'ws-ok' : 'ws-fail');
    const summary = document.createElement('summary');
    const badge = document.createElement('b');
    badge.textContent = error || !result ? 'Error' : graded ? passed ? 'Pass' : 'Fail' : hasValue ? 'Output' : 'No output';
    const title = document.createElement('span');
    title.textContent = source.name || 'Case ' + (index + 1);
    summary.append(badge, title);
    const details = document.createElement('dl');
    appendValue(details, 'Input', resultValue(source.input));
    if (graded) appendValue(details, 'Expected', resultValue(source.expected));
    if (error || !result) appendValue(details, 'Error', error || 'The runtime returned no result.');
    else appendValue(details, 'Returned', resultValue(result.actual));
    if (result?.output?.length) appendValue(details, 'Console', Array.isArray(result.output) ? result.output.join('\n') : String(result.output));
    row.append(summary, details);
    row.open = !graded || !passed;
    results.append(row);
    return passed;
  }

  function rememberSubmission(summary, solved) {
    record.submissions += 1;
    record.solved ||= solved;
    record.history.unshift({at: new Date().toISOString(), summary});
    record.history = record.history.slice(0, 10);
  }

  async function execute(submit) {
    if (active) return;
    const custom = !submit && el('mode').value === 'custom';
    let cases = submit ? problem.cases : [problem.cases[0]];
    results.replaceChildren();
    if (custom) {
      try {
        const input = JSON.parse(el('input').value);
        const test = {name: 'Custom input', input};
        if (language === 'sql') test.setup = window.NotebookSQLFixture(problem, input);
        cases = [test];
      } catch (error) {
        status.textContent = 'Check the custom JSON input. ' + error.message;
        el('input').focus();
        return;
      }
    }
    if (!code.value.trim()) {
      status.textContent = 'Enter a solution before running it.';
      code.focus();
      return;
    }

    const ticket = new AbortController();
    let started = false;
    active = ticket;
    setBusy(true);
    status.textContent = 'Starting ' + languageNames[language] + '…';
    try {
      const execution = await window.NotebookRunner.run({
        language,
        code: code.value,
        cases: cases.map(({input, setup}) => setup === undefined ? {input} : {input, setup}),
        onReady() {
          started = true;
          if (active === ticket) status.textContent = 'Running ' + (cases.length === 1 ? 'the case' : cases.length + ' cases') + '…';
        },
      }, ticket.signal);
      if (active !== ticket) return;
      if (!Array.isArray(execution) || execution.length !== cases.length) throw new Error('The runtime returned an incomplete set of results.');
      const passed = cases.reduce((count, test, index) => count + Number(showCase(test, execution[index], !custom, index)), 0);
      record.attempted = true;
      if (submit) {
        const summary = passed + '/' + cases.length + ' tests passed';
        rememberSubmission(summary, passed === cases.length);
        status.textContent = summary + (passed === cases.length ? '. Exercise solved.' : '. Open a failed case to compare results.');
      } else if (custom) {
        status.textContent = passed ? 'Custom run complete. Review the returned value.' : 'Custom run failed.';
      } else {
        status.textContent = passed ? 'Example passed. Submit to check all cases.' : 'Example failed. Compare your result with the expected output.';
      }
      save();
      showProgress();
    } catch (error) {
      if (active !== ticket) return;
      const message = String(error?.message || error || 'Run failed.');
      status.textContent = message;
      if (started) {
        record.attempted = true;
        if (submit) rememberSubmission(message, false);
        save();
        showProgress();
      }
    } finally {
      if (active === ticket) {
        active = null;
        setBusy(false);
      }
    }
  }

  function saveCode() {
    cancel('Run stopped after an edit.');
    if (results.childElementCount) {
      results.replaceChildren();
      status.textContent = 'Code changed. Run again to check this draft.';
    }
    record.code = code.value;
    save();
  }

  code.addEventListener('input', saveCode);
  code.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      execute(event.shiftKey);
      return;
    }
    if (event.key !== 'Enter' || event.isComposing || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const before = code.value.slice(0, code.selectionStart);
    const line = before.slice(before.lastIndexOf('\n') + 1);
    const indent = line.match(/^[\t ]*/)[0] + (/(?:\{|:)\s*$/.test(line) ? (language === 'javascript' ? '  ' : '    ') : '');
    if (!indent || code.value.length + indent.length + 1 > code.maxLength) return;
    event.preventDefault();
    code.setRangeText('\n' + indent, code.selectionStart, code.selectionEnd, 'end');
    saveCode();
  });
  el('input').addEventListener('input', () => {
    cancel('Run stopped after an edit.');
    record.custom = el('input').value;
    save();
  });
  el('mode').addEventListener('change', () => {
    cancel('Run stopped.');
    record.mode = el('mode').value;
    updateMode();
    save();
  });
  el('jump').addEventListener('click', () => code.focus());
  el('run').addEventListener('click', () => execute(false));
  el('submit').addEventListener('click', () => execute(true));
  el('stop').addEventListener('click', () => cancel('Run stopped.'));
  problemPicker.addEventListener('change', () => selectProblem(problems.find(item => item.id === problemPicker.value), language));
  languagePicker.addEventListener('change', () => chooseLanguage(languagePicker.value));
  const groups = new Map();
  for (const item of [...problems].sort((a, b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title))) {
    if (!groups.has(item.company)) {
      const group = document.createElement('optgroup');
      group.label = item.company;
      groups.set(item.company, group);
      problemPicker.append(group);
    }
    const label = item.languages.includes('sql') ? item.title + ' (SQL)' : item.title;
    groups.get(item.company).append(new Option(label, item.id));
  }
  el('intro').textContent = 'Write and test solutions for ' + problems.length + ' exercises in Python, JavaScript, or SQL. Code runs in your browser and drafts save on this device.';
  const selection = read('selection');
  const initial = problems.find(item => item.id === selection?.id) || problems.find(item => item.company === 'Delta Air Lines') || problems[0];
  selectProblem(initial, selection?.language);

  window.NotebookWorkspace = {
    open(company, title) {
      const match = problems.find(item => item.company === company && item.title === title);
      if (match) selectProblem(match, language);
      document.getElementById('nav-workspace').click();
    },
    leave() {
      cancel('Run stopped.');
    },
  };
})();
