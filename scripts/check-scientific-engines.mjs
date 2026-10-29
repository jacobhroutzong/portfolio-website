import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const hash = value => createHash('sha256').update(value).digest('hex');
export async function verifyScientificEngines({ remote = false } = {}) {
  const release = JSON.parse(fs.readFileSync(path.join(root, 'src/data/scientific-engine-release.json'), 'utf8'));
  let outputs = 0, sources = 0;
  for (const entry of release.engines) {
    assert.match(entry.repository, /^jacobhroutzong\/(scientific-numerical-engine|symbolic-math-engine)$/);
    assert.match(entry.commit, /^[0-9a-f]{40}$/);
    const directory = path.join(root, 'public/engines');
    const bytes = fs.readFileSync(path.join(directory, `${entry.engine}-manifest.json`));
    assert.equal(hash(bytes), entry.manifestSha256, 'Manifest differs from reviewed release');
    const manifest = JSON.parse(bytes);
    assert.equal(manifest.sourceCommit, entry.commit);
    assert.equal(manifest.sourceTreeClean, true);
    for (const [name, output] of Object.entries(manifest.outputs)) {
      assert.equal(path.basename(name), name);
      const data = fs.readFileSync(path.join(directory, name));
      assert.equal(data.length, output.bytes); assert.equal(hash(data), output.sha256); outputs++;
    }
    for (const [file, expected] of Object.entries({ ...manifest.sources, ...manifest.headers, 'tools/build_wasm.py': manifest.buildScriptSha256 })) {
      assert.match(expected, /^[0-9a-f]{64}$/);
      const name = file.replaceAll('\\', '/');
      assert.ok(!name.includes('..') && !name.startsWith('/'));
      if (remote) {
        const response = await fetch(`https://raw.githubusercontent.com/${entry.repository}/${entry.commit}/${name}`, { signal: AbortSignal.timeout(20000) });
        assert.equal(response.status, 200, `Missing pinned source ${name}`);
        assert.equal(hash(Buffer.from((await response.text()).replaceAll('\r\n', '\n'))), expected, `Pinned source mismatch: ${name}`);
      }
      sources++;
    }
  }
  assert.ok(fs.readFileSync(path.join(root, 'public/engines/notices/index.txt'), 'utf8').includes('Emscripten'));
  return { engines: release.engines.length, outputs, sourceFiles: sources, remoteSourceVerified: remote };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  console.log(JSON.stringify(await verifyScientificEngines({ remote: process.argv.includes('--remote') })));
}
