import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { evidenceSchema, sourceDigests } from '../src/lib/causarium.mjs';
import { readReviewedArtifact } from '../scripts/export-causarium.mjs';

const asset = 'media/causarium/evidence-v1.json';
const bytes = await readFile(new URL('../public/' + asset, import.meta.url), 'utf8');
const evidence = JSON.parse(bytes);
const pins = JSON.parse(await readFile(new URL('../scripts/public-research-digests.json', import.meta.url), 'utf8'));

test('Causarium projection has its exact pin, reviewed source digests and evidence shapes', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'), pins[asset]);
  const { pythia, qwen, offlineTests } = evidenceSchema.parse(evidence);
  assert.equal(offlineTests, 26);
  assert.deepEqual([pythia.whole.sourceSha256, pythia.selective.sourceSha256,
    pythia.donor.sourceSha256, qwen.sourceSha256], Object.values(sourceDigests));
  assert.equal(pythia.selective.rows[0].matrix[1][3].delta, 3.689208984375);
  assert.equal(pythia.donor.rows[1].interventions[4].margin, 2.2158203125);
  assert.deepEqual(qwen.rows.map(row => [row.base.margin, row.adapted.margin]),
    [[-0.5, 20.5625], [0.625, 21.25]]);
  assert.deepEqual(qwen.rows.map(row => [row.baseRecipient[1].delta, row.adaptedRecipient[1].delta]),
    [[2.25, -2.3125], [2, -2.1875]]);
});

test('validation rejects tampered source, arithmetic, and intervention labels', () => {
  assert.throws(() => readReviewedArtifact('pythia-001.json', Buffer.from('{}')), /Unreviewed/);
  const wrongScore = structuredClone(evidence);
  wrongScore.qwen.rows[0].baseRecipient[1].delta += 1;
  assert.equal(evidenceSchema.safeParse(wrongScore).success, false);
  const wrongDonor = structuredClone(evidence);
  wrongDonor.qwen.rows[0].baseRecipient[2].donorCase = 'arithmetic-a';
  assert.equal(evidenceSchema.safeParse(wrongDonor).success, false);
});

test('the public schema excludes raw Tunera data even at nested levels', () => {
  for (const key of ['prompt_ids', 'activations', 'local_path', 'dataset_sha256', 'checkpoint_file', 'raw_logs']) {
    const candidate = structuredClone(evidence);
    candidate.qwen.rows[0][key] = 'private';
    assert.equal(evidenceSchema.safeParse(candidate).success, false);
    assert.doesNotMatch(bytes, new RegExp('"' + key + '"'));
  }
  assert.doesNotMatch(bytes, /tunera-private|synthetic-00[39]|\/mnt\/|[A-Z]:[\\/]|safetensors-000|<\|im_/i);
});
