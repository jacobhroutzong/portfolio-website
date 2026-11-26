// This module is booted from immutable application bytes inside an opaque-origin iframe.
const decoder = new TextDecoder();
const maxResultLength = 65536;
let output = '';

function writeOutput(...parts) {
  if (output.length >= 4096) return;
  const line = parts.map(part => typeof part === 'string' ? part : String(part)).join(' ');
  output = (output + line.slice(0, 4096) + '\n').slice(0, 4096);
}

function jsonResult(value) {
  const text = JSON.stringify(value, (_key, item) => {
    if (item === undefined || typeof item === 'function' || typeof item === 'symbol' ||
        (typeof item === 'number' && !Number.isFinite(item))) {
      throw new Error('Return a JSON value with finite numbers.');
    }
    return item;
  });
  if (text.length > maxResultLength) throw new Error('Result exceeds 64 KiB.');
  return JSON.parse(text);
}

async function moduleFrom(bytes) {
  const url = URL.createObjectURL(new Blob([bytes], {type:'text/javascript'}));
  try { return await import(url); }
  finally { URL.revokeObjectURL(url); }
}

function javascript(code) {
  for (const name of ['log', 'info', 'warn', 'error', 'debug']) console[name] = writeOutput;
  let makeSolve;
  return async ({ input }) => {
    makeSolve ??= new Function('"use strict";\n' + code + '\n;return solve;');
    const solve = makeSolve();
    if (typeof solve !== 'function') throw new Error('Define function solve(data).');
    return jsonResult(await solve(input));
  };
}

async function python(assets, code) {
  // Pyodide's standard bootstrap expects two fetches. Supply the pinned, transferred bytes
  // locally; never delegate requests to a network implementation.
  const virtualBase = 'https://runtime.invalid/';
  const files = new Map([
    [virtualBase + 'pyodide.asm.wasm', [assets['python.wasm'], 'application/wasm']],
    [virtualBase + 'python_stdlib.zip', [assets['stdlib.bin'], 'application/octet-stream']],
  ]);
  globalThis.fetch = async resource => {
    const url = typeof resource === 'string' ? resource : resource.url || resource.href;
    const file = files.get(url);
    if (!file) throw new Error('This runtime has no external network access.');
    return new Response(file[0], {headers:{'Content-Type':file[1]}});
  };
  const [{loadPyodide}, {default:createPyodideModule}] = await Promise.all([
    moduleFrom(assets['pyodide.mjs']), moduleFrom(assets['pyodide.asm.mjs']),
  ]);
  const py = await loadPyodide({
    createPyodideModule,
    indexURL:virtualBase, packageBaseUrl:virtualBase,
    lockFileContents:decoder.decode(assets['pyodide-lock.json']),
    stdout:writeOutput, stderr:writeOutput, stdin:() => null,
    jsglobals:Object.create(null),
  });
  const newScope = py.runPython('dict');
  return ({ input }) => {
    const scope = newScope();
    try {
      scope.set('_source', code);
      scope.set('_case_json', JSON.stringify(input));
      const text = py.runPython([
        'import json',
        '_scope = {"__name__": "__main__"}',
        'exec(compile(_source, "solution.py", "exec"), _scope)',
        'if not callable(_scope.get("solve")): raise ValueError("Define solve(data).")',
        'json.dumps(_scope["solve"](json.loads(_case_json)), allow_nan=False)',
      ].join('\n'), { globals:scope });
      if (text.length > maxResultLength) throw new Error('Result exceeds 64 KiB.');
      return JSON.parse(text);
    } finally { scope.destroy(); }
  };
}

async function sqlite(assets, code) {
  const init = new Function(decoder.decode(assets['sql-wasm.js']) + '\n;return initSqlJs;')();
  const SQL = await init({ wasmBinary:new Uint8Array(assets['sql.wasm']) });
  return ({ setup }) => {
    const db = new SQL.Database();
    try {
      if (setup) db.run(setup);
      db.run('PRAGMA query_only=ON');
      const rows = [];
      let statementCount = 0;
      let size = 0;
      for (const statement of db.iterateStatements(code)) {
        if (++statementCount !== 1 || !statement.getColumnNames().length) {
          throw new Error('Enter a single query that returns rows.');
        }
        while (statement.step()) {
          const row = statement.get();
          size += JSON.stringify(row).length + 1;
          if (rows.length >= 2000 || size >= maxResultLength) throw new Error('Query result is too large.');
          rows.push(row);
        }
      }
      if (!statementCount) throw new Error('Enter a query that returns rows.');
      return jsonResult(rows);
    } finally { db.close(); }
  };
}

self.addEventListener('message', async function start(event) {
  self.removeEventListener('message', start);
  const { language, code, inputs, assets } = event.data;
  const send = event.ports[0].postMessage.bind(event.ports[0]);
  try {
    const execute = language === 'javascript' ? javascript(code) :
      language === 'python' ? await python(assets, code) : await sqlite(assets, code);
    send({type:'ready'});
    for (const item of inputs) {
      output = '';
      try {
        const actual = await execute(item);
        send({type:'result',result:{actual,output}});
      } catch (error) {
        send({type:'result',result:{error:String(error.message || error).slice(-1800),output}});
      }
    }
  } catch (error) {
    send({type:'error',message:String(error.message || error).slice(-1800)});
  }
}, {once:true});
