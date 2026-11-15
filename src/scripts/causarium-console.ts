function showSelection(elements: HTMLElement[], value: string, key: string) {
  for (const element of elements) element.hidden = element.dataset[key] !== value;
}

const signed = (value: string, digits: number) => {
  const number = Number(value);
  return (number < 0 ? '−' : number > 0 ? '+' : '') + Math.abs(number).toFixed(digits);
};

export function initializeConsole(root: HTMLElement) {
  const all = <T extends HTMLElement>(selector: string, parent = root) =>
    Array.from(parent.querySelectorAll<T>(selector));
  const tabs = all<HTMLAnchorElement>('[data-tab]');
  const tablist = root.querySelector('[data-tabs]');
  const panels = all<HTMLElement>('[data-view]');
  const tabFor = () => tabs.find(tab => tab.hash === location.hash) ?? tabs[0];
  const selectTab = (tab: HTMLAnchorElement, navigate = false) => {
    for (const item of tabs) {
      item.setAttribute('aria-selected', String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = '#' + panel.id !== tab.hash;
    if (navigate && location.hash !== tab.hash) history.replaceState(null, '', tab.hash);
  };
  tablist?.setAttribute('role', 'tablist');
  tablist?.setAttribute('aria-label', 'Research console views');
  panels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.tabIndex = 0;
  });
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', event => {
      event.preventDefault();
      selectTab(tab, true);
    });
    tab.addEventListener('keydown', event => {
      const keys: Record<string, number | undefined> = {
        ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length,
        Home: 0, End: tabs.length - 1,
      };
      const index = keys[event.key];
      if (index === undefined) return;
      event.preventDefault();
      selectTab(tabs[index], true);
      tabs[index].focus();
    });
  });
  window.addEventListener('hashchange', () => selectTab(tabFor()));
  selectTab(tabFor());

  all<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
    root.dataset.presentation = button.dataset.mode;
    all<HTMLButtonElement>('[data-mode]').forEach(item =>
      item.setAttribute('aria-pressed', String(item === button)));
  }));
  root.dataset.presentation = 'guided';

  const pair = root.querySelector<HTMLSelectElement>('[data-pair]')!;
  const layer = root.querySelector<HTMLSelectElement>('[data-layer]')!;
  const position = root.querySelector<HTMLSelectElement>('[data-position]')!;
  const measure = root.querySelector<HTMLSelectElement>('[data-measure]')!;
  const pythia = all<HTMLElement>('[data-pythia]');
  const buttonsIn = (panel: HTMLElement) => all<HTMLButtonElement>('[data-site]', panel);
  const refreshPythia = () => {
    showSelection(pythia, pair.value, 'pythia');
    const panel = pythia[Number(pair.value)];
    const buttons = buttonsIn(panel);
    const key = measure.value === 'margin' ? 'margin' : 'delta';
    panel.querySelector('[data-map-negative]')!.textContent = key === 'delta' ? '− Toward alternative' : '− Alternative higher';
    panel.querySelector('[data-map-positive]')!.textContent = key === 'delta' ? '+ Toward preferred' : '+ Preferred higher';
    let selected = buttons[0];
    for (const button of buttons) {
      const {site, siteLayer, sitePosition} = button.dataset;
      const active = layer.value === siteLayer && position.value === sitePosition;
      if (active) selected = button;
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
      const value = button.dataset[key]!;
      button.textContent = signed(value, 3);
      button.setAttribute('aria-label', `${site}, ${key === 'delta' ? 'change' : 'patched margin'} ${button.textContent} logits`);
      const cell = button.parentElement!;
      cell.dataset.heatTone = Number(value) < 0 ? 'negative' : 'positive';
      cell.style.setProperty('--level', button.dataset[key + 'Tone']!);
    }
    for (const output of all<HTMLElement>('[data-output]', panel)) {
      const field = output.dataset.output!;
      const value = selected.dataset[field.replace('-exact', '')]!;
      output.textContent = field === 'site' ? value : field.endsWith('-exact')
        ? value.replace('-', '−') : signed(value, 4);
    }
  };
  [pair, layer, position, measure].forEach(field => field.addEventListener('change', refreshPythia));
  for (const panel of pythia) {
    const cells = buttonsIn(panel);
    for (const cell of cells) {
      cell.addEventListener('click', () => {
        layer.value = cell.dataset.siteLayer!;
        position.value = cell.dataset.sitePosition!;
        refreshPythia();
      });
      cell.addEventListener('keydown', event => {
        const row = Number(cell.dataset.siteLayer);
        const col = Number(cell.dataset.sitePosition);
        const keys: Record<string, [number, number] | undefined> = {
          ArrowUp: [row - 1, col], ArrowDown: [row + 1, col],
          ArrowLeft: [row, col - 1], ArrowRight: [row, col + 1],
          Home: [row, 0], End: [row, position.options.length - 1],
        };
        const next = keys[event.key];
        if (!next) return;
        event.preventDefault();
        const target = cells.find(item => Number(item.dataset.siteLayer) === next[0] &&
          Number(item.dataset.sitePosition) === next[1]);
        if (target) {
          cell.tabIndex = -1;
          target.tabIndex = 0;
          target.focus();
        }
      });
    }
  }
  refreshPythia();

  const example = root.querySelector<HTMLSelectElement>('[data-qwen-case]')!;
  const direction = root.querySelector<HTMLSelectElement>('[data-direction]')!;
  const status = root.querySelector('[data-compare-status]')!;
  const qwen = all<HTMLElement>('[data-qwen]');
  const refreshQwen = () => {
    showSelection(qwen, example.value, 'qwen');
    const active = qwen[Number(example.value)];
    showSelection(all<HTMLElement>('[data-recipient]', active), direction.value, 'recipient');
    status.textContent = `${example.selectedOptions[0].text}. ${direction.selectedOptions[0].text}.`;
  };
  [example, direction].forEach(field => field.addEventListener('change', refreshQwen));
  refreshQwen();
  root.dataset.ready = 'true';
}
