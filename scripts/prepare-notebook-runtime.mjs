import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const destination = new URL('public/projects/interview-notebook/lab/runtime/', root);
await mkdir(fileURLToPath(destination), { recursive: true });
const files = {
  'pyodide/pyodide.mjs': 'pyodide.mjs',
  'pyodide/pyodide.asm.mjs': 'pyodide.asm.mjs',
  'pyodide/pyodide.asm.wasm': 'python.wasm',
  'pyodide/python_stdlib.zip': 'stdlib.bin',
  'pyodide/pyodide-lock.json': 'pyodide-lock.json',
  'sql.js/dist/sql-wasm.js': 'sql-wasm.js',
  'sql.js/dist/sql-wasm.wasm': 'sql.wasm',
  'sql.js/LICENSE': 'sql-NOTICE.txt',
};
for (const [source, name] of Object.entries(files)) {
  const from = new URL('node_modules/' + source, root);
  const to = new URL(name, destination);
  if (name.endsWith('.js') || name.endsWith('.mjs')) {
    const script = await readFile(from, 'utf8');
    // Ship only executable runtime files. Their development source maps are excluded.
    await writeFile(to, script.replace(/^\s*\/\/[#@]\s*sourceMappingURL=.*$/gm, ''));
  } else {
    await copyFile(from, to);
  }
}
