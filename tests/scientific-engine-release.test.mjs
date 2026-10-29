import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyScientificEngines } from '../scripts/check-scientific-engines.mjs';
test('Scientific release bundles match reviewed clean source commits and output hashes', async () => {
  const result = await verifyScientificEngines();
  assert.equal(result.engines, 2); assert.equal(result.outputs, 4);
  assert.ok(result.sourceFiles >= 10);
});
