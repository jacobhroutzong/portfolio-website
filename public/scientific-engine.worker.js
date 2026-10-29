// Static module worker: imports the generated engines without Vite rewriting.
let engine;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      if (!['numerical', 'symbolic'].includes(data.kind)) throw new Error('Unknown engine');
      const module = await import(`/engines/${data.kind}.mjs`);
      engine = await module.default({ locateFile: name => `/engines/${name}` });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'run' && engine) {
      const raw = data.kind === 'numerical' ? engine.solve(data.wire) : engine.differentiate(data.expression, data.variable);
      self.postMessage({ type: 'result', result: JSON.parse(raw) });
    } else throw new Error('Engine is not ready');
  } catch (error) {
    self.postMessage({ type: 'failure', error: error instanceof Error ? error.message : 'Engine failure' });
  }
};
