import { compareReports, metrics, parseRecords, readBenchmarkComparison, readReport } from '../lib/tunera-reports.mjs';

const reportKey = 'tunera-tool-reports-v1';
const legacyReportKey = 'modelforge-reports-v1';
const notesKey = 'tunera-research-notes-v1';
const maxRequest = 2_000_000;
const maxReport = 4_000_000;
const pretty = value => JSON.stringify(value, null, 2);
const percent = value => value === null ? 'N/A' : `${(value * 100).toFixed(1)}%`;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function download(value, name) {
  const url = URL.createObjectURL(new Blob([pretty(value)], { type: 'application/json' }));
  const link = element('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readFile(file, limit) {
  if (file.size > limit) throw new Error(`File exceeds ${limit / 1_000_000} MB.`);
  return file.text();
}

export function setupEvaluation(lab) {
  const find = name => lab.querySelector(`[data-${name}]`);
  const form = find('evaluate');
  const score = find('score');
  const example = find('example');
  const reports = [];
  const comparison = find('compare');
  const selection = find('report');
  const inspect = find('inspect-case');
  const textField = name => form.elements.namedItem(name);
  const notes = find('notes');
  let exampleCases = [];
  let fixture;
  let guide = [];
  let busy = false;

  function addReport(value, source) {
    const report = readReport(value);
    return reports.push({ report, source }) - 1;
  }

  function renderInspection() {
    const row = reports[selection.value]?.report.cases[inspect.value];
    find('inspection').hidden = !row;
    if (!row) return;
    find('expected').textContent = pretty(row.expected);
    find('actual').textContent = row.raw_output ?? '(missing prediction)';
    find('failure').textContent = `${row.success ? 'Pass' : row.failure || 'Failed'}${typeof row.request === 'string' ? ` · ${row.request}` : ''}`;
  }

  function renderMetrics() {
    const selected = reports[selection.value];
    const other = reports[comparison.value];
    const container = find('metrics');
    container.replaceChildren();
    find('export').disabled = !selected;
    inspect.replaceChildren();
    if (!selected) return;
    const left = selected.report;
    const right = other?.report;
    const paired = right && compareReports(left, right);
    find('comparison').textContent = right
      ? paired ? 'Case hashes and IDs match. Changes are shown in percentage points.' : 'Case-set equivalence is unverified. Showing separate scores without deltas.'
      : `${left.n_cases} cases · ${selected.source} · saved-output scores`;
    for (const [index, [key, label, help]] of metrics.entries()) {
      const card = element('div', undefined, 'card');
      const delta = paired?.[index]?.delta;
      const change = delta == null ? '' : ` (${delta >= 0 ? '+' : ''}${(100 * delta).toFixed(1)} pp)`;
      const value = right ? `${percent(left[key])} → ${percent(right[key])}${change}` : percent(left[key]);
      card.append(element('strong', label), element('p', value), element('small', help));
      container.append(card);
    }
    left.cases.forEach((row, index) => inspect.add(new Option(`${row.success ? 'Pass' : 'Fail'} · ${row.id}`, index)));
    const firstFailure = left.cases.findIndex(row => !row.success);
    if (firstFailure >= 0) inspect.selectedIndex = firstFailure;
    renderInspection();
  }

  function updateReports(index = reports.length - 1) {
    selection.replaceChildren(new Option('No report', ''));
    comparison.replaceChildren(new Option('No comparison', ''));
    reports.forEach(({ report }, i) => {
      selection.add(new Option(report.label, i));
      comparison.add(new Option(report.label, i));
    });
    if (index >= 0) selection.value = String(index);
    renderMetrics();
  }

  function enableScore() {
    score.disabled = busy || (!find('advanced').checked && !guide.length);
  }

  function loadExample() {
    exampleCases = fixture.cases;
    const outputs = new Map(fixture.predictions.map(item => [item.id, item.raw_output]));
    const container = find('guide');
    container.replaceChildren();
    guide = exampleCases.map((item, index) => {
      const card = element('details', undefined, 'card');
      card.open = index === 0;
      const label = element('label', 'Saved response');
      const editor = element('textarea');
      editor.rows = 4;
      editor.spellcheck = false;
      editor.value = outputs.get(item.id) ?? '';
      label.append(editor);
      const omitLabel = element('label', 'Mark as missing response');
      const omit = element('input');
      omit.type = 'checkbox';
      omit.checked = !outputs.has(item.id);
      editor.disabled = omit.checked;
      omit.addEventListener('change', () => { editor.disabled = omit.checked; });
      omitLabel.append(omit);
      const expected = item.expected.action === 'clarify' ? 'Ask for missing information' : `Call ${item.expected.tool}`;
      card.append(element('summary', `${item.id} · ${expected}`), element('p', item.request), label, omitLabel);
      container.append(card);
      return { id: item.id, editor, omit };
    });
    textField('cases').value = exampleCases.map(row => JSON.stringify(row)).join('\n');
    textField('predictions').value = fixture.predictions.map(row => JSON.stringify(row)).join('\n');
    find('advanced').checked = false;
    enableScore();
  }

  find('advanced').addEventListener('change', enableScore);
  example.addEventListener('click', loadExample);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (score.disabled) return;
    busy = true;
    enableScore();
    const status = find('evaluation-status');
    status.textContent = 'Scoring saved responses…';
    try {
      const label = textField('label').value.trim();
      let body;
      if (find('advanced').checked) {
        const cases = textField('cases').value;
        const predictions = textField('predictions').value;
        const encoder = new TextEncoder();
        if (encoder.encode(cases).length + encoder.encode(predictions).length > maxRequest) {
          throw new Error('Evaluation input exceeds 2 MB.');
        }
        const rows = [parseRecords(cases), parseRecords(predictions)];
        if (!rows[0].length || rows.some(list => list.length > 200)) throw new Error('Use 1–200 cases and up to 200 responses.');
        // Keep each raw record intact so Python can still reject duplicate JSON keys.
        const array = text => `[${text.split(/\r?\n/).filter(line => line.trim()).join(',')}]`;
        body = `{"label":${JSON.stringify(label)},"cases":${array(cases)},"predictions":${array(predictions)}}`;
      } else {
        const predictions = guide.filter(item => !item.omit.checked).map(({ id, editor }) => ({ id, raw_output: editor.value }));
        body = JSON.stringify({ label, cases: exampleCases, predictions });
      }
      if (new TextEncoder().encode(body).length > maxRequest) throw new Error('Evaluation input exceeds 2 MB.');
      const response = await fetch('/api/crucible/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Scoring is temporarily unavailable.');
      updateReports(addReport(result, 'Scored by the CPU evaluator'));
      try {
        const saved = reports.filter(item => item.source === 'Scored by the CPU evaluator').slice(-20).map(item => item.report);
        localStorage.setItem(reportKey, JSON.stringify(saved));
        status.textContent = 'Scored and saved in this browser.';
      } catch { status.textContent = 'Scored. Export this report to keep it.'; }
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; enableScore(); }
  });

  for (const input of lab.querySelectorAll('[data-jsonl]')) {
    input.addEventListener('change', async () => {
      if (!input.files[0]) return;
      try {
        textField(input.dataset.jsonl).value = await readFile(input.files[0], maxRequest);
        find('advanced').checked = true;
        enableScore();
        find('evaluation-status').textContent = 'JSONL loaded. Review the inputs before scoring.';
      } catch (error) { find('evaluation-status').textContent = error.message; }
      input.value = '';
    });
  }

  find('report-file').addEventListener('change', async event => {
    const input = event.currentTarget;
    if (!input.files[0]) return;
    try {
      const value = JSON.parse(await readFile(input.files[0], maxReport));
      updateReports(addReport(value, 'Imported report'));
      find('report-status').textContent = 'Report loaded for this session.';
    } catch (error) { find('report-status').textContent = error.message; }
    input.value = '';
  });
  find('benchmark-file').addEventListener('change', async event => {
    const input = event.currentTarget;
    if (!input.files[0]) return;
    const status = find('benchmark-status');
    const panel = find('benchmark');
    panel.replaceChildren();
    try {
      const artifact = readBenchmarkComparison(JSON.parse(await readFile(input.files[0], maxReport)));
      const number = (value, units) => value == null ? 'N/A' : `${value.toFixed(2)} ${units}`;
      for (const [label, result] of [['Baseline', artifact.base], ['Fine-tuned', artifact.fine_tuned]]) {
        const card = element('div', undefined, 'card');
        card.append(element('strong', label), element('p', `Accuracy: ${percent(result.accuracy)}`),
          element('p', `Structured validity: ${percent(result.structured_validity ?? null)}`),
          element('p', `Mean latency: ${number(result.mean_latency_seconds, 's')}`),
          element('p', `Throughput: ${number(result.tokens_per_second, 'tokens/s')}`),
          element('p', `Peak GPU allocation: ${number(result.peak_gpu_bytes == null ? null : result.peak_gpu_bytes / 2 ** 30, 'GiB')}`));
        panel.append(card);
      }
      status.textContent = `${artifact.base.provenance.model_id} · ${artifact.base.count} cases · ${artifact.base.provenance.smoke_only ? 'Smoke test' : 'CLI report'} · imported measurements`;
    } catch (error) { status.textContent = error.message; }
    input.value = '';
  });
  for (const select of [selection, comparison]) select.addEventListener('change', renderMetrics);
  inspect.addEventListener('change', renderInspection);
  find('export').addEventListener('click', () => download(reports[selection.value].report, 'tunera-tool-use-report.json'));
  find('export-notes').addEventListener('click', () => download({ project: 'Tunera', notes: notes.value }, 'tunera-notes.json'));
  notes.addEventListener('input', () => {
    try { localStorage.setItem(notesKey, notes.value); }
    catch { find('report-status').textContent = 'Browser storage unavailable. Export notes to keep them.'; }
  });

  for (const [key, source] of [[legacyReportKey, 'Crucible browser report'], [reportKey, 'Scored by the CPU evaluator']]) {
    try {
      const values = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(values)) continue;
      for (const value of values.slice(-20)) {
        try { addReport(value, source); } catch { /* Skip malformed stored entries. */ }
      }
    } catch { /* Storage can be unavailable. */ }
  }
  try { notes.value = localStorage.getItem(notesKey) ?? localStorage.getItem('modelforge-notes') ?? ''; } catch { /* Optional storage. */ }
  updateReports();
  fetch('/apps/crucible/fixture.json').then(async response => {
    if (!response.ok) throw new Error('Could not load the example.');
    fixture = await response.json();
    example.disabled = false;
    const index = addReport(fixture.runs[0], 'Hand-authored walkthrough');
    updateReports(selection.value === '' ? index : Number(selection.value));
    // Keep edits in advanced mode if the fixture was slow to load.
    if (!find('advanced').checked && !textField('cases').value && !textField('predictions').value) loadExample();
  }).catch(() => { find('evaluation-status').textContent = 'Worked example unavailable. You can still score advanced JSONL inputs.'; });
}
