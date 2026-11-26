// The host owns cancellation and timing. Student code runs only in an opaque-origin frame's worker.
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const runtimeNames = {
    javascript: [],
    python: ['pyodide.mjs', 'pyodide.asm.mjs', 'python.wasm', 'stdlib.bin', 'pyodide-lock.json'],
    sql: ['sql-wasm.js', 'sql.wasm'],
  };
  const assets = new Map();

  function readAsset(path) {
    if (!assets.has(path)) {
      const request = fetch(new URL(path, base), { credentials: 'omit' }).then(response => {
        if (!response.ok) throw new Error('Could not load ' + path + '. Refresh and try again.');
        return response.arrayBuffer();
      }).catch(error => { assets.delete(path); throw error; });
      assets.set(path, request);
    }
    return assets.get(path);
  }

  async function run({ language, code, cases, onReady }, signal) {
    if (!Object.hasOwn(runtimeNames, language)) throw new Error('Unsupported language.');
    if (typeof code !== 'string' || code.length > 65536) throw new Error('Use at most 65,536 characters of code.');
    if (!Array.isArray(cases) || cases.length === 0 || cases.length > 32) throw new Error('Choose 1 to 32 cases.');
    // Expected results never enter the execution worker.
    const inputs = cases.map(({ input, setup }) => ({ input, setup }));
    if (JSON.stringify(inputs).length > 524288) throw new Error('Test inputs exceed the 512 KiB limit.');
    signal?.throwIfAborted();
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.hidden = true;
    frame.title = 'Isolated code runner';
    frame.src = new URL('runner-frame.html', base).href;
    const channel = new MessageChannel();
    let timer;
    let finished = false;
    let phase = 'loading';
    const results = [];
    return new Promise((resolve, reject) => {
      function finish(value, error) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
        channel.port1.close();
        channel.port2.close();
        frame.remove();
        if (error) reject(error); else resolve(value);
      }
      function cancel() { finish(null, new DOMException('Run stopped.', 'AbortError')); }
      function deadline(ms, message) {
        clearTimeout(timer);
        timer = setTimeout(() => finish(null, new Error(message)), ms);
      }
      deadline(45000, 'The language runtime did not start in time. Retry the download.');
      signal?.addEventListener('abort', cancel, { once: true });
      channel.port1.onmessage = ({ data }) => {
        if (!data || finished) return;
        if (data.type === 'error') { finish(null, new Error(String(data.message).slice(0, 1800))); return; }
        if (data.type === 'ready' && phase === 'loading') {
          phase = 'running';
          deadline(4000, 'Time limit exceeded (4 seconds per case).');
          onReady?.();
          return;
        }
        if (data.type === 'result' && phase === 'running' && results.length < inputs.length) {
          results.push(data.result);
          if (results.length === inputs.length) finish(results);
          else deadline(4000, 'Time limit exceeded (4 seconds per case).');
        }
      };
      const loaded = new Promise((yes, no) => {
        frame.onload = yes;
        frame.onerror = () => no(new Error('The isolated runner frame could not load.'));
      });
      document.body.append(frame);
      Promise.all([
        loaded,
        readAsset('runner-worker.js'),
        Promise.all(runtimeNames[language].map(async name => [name, await readAsset('runtime/' + name)])),
      ]).then(([, worker, entries]) => {
        if (finished) return;
        // This frame has an opaque origin; the private port is handed to this window only.
        frame.contentWindow.postMessage({ worker, assets: Object.fromEntries(entries), code, inputs, language }, '*', [channel.port2]);
      }).catch(error => finish(null, error));
    });
  }
  window.NotebookRunner = Object.freeze({ run });
})();
