import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { evidenceSchema, researchCommit, sourceDigests } from '../src/lib/causarium.mjs';

export function readReviewedArtifact(name, bytes) {
  if (!Object.hasOwn(sourceDigests, name) || createHash('sha256').update(bytes).digest('hex') !== sourceDigests[name]) {
    throw new Error('Unreviewed Causarium artifact');
  }
  const record = JSON.parse(bytes.toString('utf8'));
  if (record.schema_version !== 1 || record.status !== 'measured_local_inference') {
    throw new Error('Unexpected Causarium source schema or status');
  }
  return record;
}

const margins = row => ({clean: row.clean_margin, corrupt: row.corrupt_margin});
const patch = score => ({sham: score.sham_margin, margin: score.patched_margin, delta: score.patch_delta});
const logits = score => ({numeric: score.numeric_logit, quoted: score.quoted_logit, margin: score.margin});
const caseId = id => ({'synthetic-003': 'arithmetic-a', 'synthetic-009': 'arithmetic-b'})[id];
const transfer = score => ({
  condition: score.condition, donorState: score.donor_state, donorCase: caseId(score.donor_prompt),
  donorIndex: score.donor_position, positionId: score.donor_model_position_id,
  ...logits(score), delta: score.delta_from_recipient,
});

export async function exportEvidence(checkout) {
  const names = Object.keys(sourceDigests);
  const [whole, selective, donor, qwen] = await Promise.all(names.map(async name =>
    readReviewedArtifact(name, await readFile(resolve(checkout, 'research', name)))));
  return evidenceSchema.parse({
    schemaVersion: 1, researchCommit, offlineTests: 26,
    pythia: {
      model: whole.model.id, revision: whole.model.revision_sha,
      tokenizerRevision: whole.model.tokenizer_revision_sha,
      whole: {
        sourceSha256: sourceDigests[names[0]], configSha256: whole.data.config_sha256,
        layer: whole.method.layer, seed: whole.method.seed, seconds: whole.elapsed_seconds,
        rows: whole.results.map(row => ({id: row.pair_id, ...margins(row.scores), ...patch(row.scores)})),
      },
      selective: {
        sourceSha256: sourceDigests[names[1]], configSha256: selective.data.config_sha256,
        promptsSha256: selective.data.prompts_sha256, seed: selective.method.seed,
        layers: selective.method.layers, positions: selective.method.position_labels,
        rows: selective.results.map(row => ({
          id: row.id, ...margins(row), matrix: row.matrix.map(layer => layer.map(patch)),
          controls: row.controls.map(control => ({
            full: patch(control.whole_layer), mismatched: patch(control.mismatched_position),
          })),
        })),
      },
      donor: {
        sourceSha256: sourceDigests[names[2]], configSha256: donor.input_sha256['donor_experiment.json'],
        layer: donor.method.layer, position: donor.method.target_position, seed: donor.method.seed,
        rows: donor.results.map(row => ({
          id: row.id, ...margins(row),
          interventions: row.interventions.map(score =>
            ({id: score.donor_id, margin: score.margin, delta: score.delta_from_corrupt})),
        })),
      },
    },
    qwen: {
      model: qwen.model.id, revision: qwen.model.revision, tokenizerRevision: qwen.model.tokenizer_revision,
      sourceSha256: sourceDigests[names[3]], weightsSha256: qwen.model.weights_sha256,
      tokenizerSha256: qwen.model.tokenizer_sha256, templateSha256: qwen.model.chat_template_sha256,
      adapterSha256: qwen.adapter.weights_sha256, adapterConfigSha256: qwen.adapter.config_sha256,
      adapterRank: qwen.adapter.rank, adapterStep: qwen.adapter.step, layer: qwen.method.layer,
      positionId: qwen.results[0].model_position_id, seed: qwen.method.seed, dtype: qwen.model.dtype,
      runtime: {
        python: qwen.runtime.python, torch: qwen.runtime.packages.torch,
        transformers: qwen.runtime.packages.transformers, peft: qwen.runtime.packages.peft,
        seconds: qwen.runtime.inference_seconds, peakAllocatedBytes: qwen.runtime.peak_allocated_bytes,
      },
      rows: qwen.results.map(row => ({
        id: caseId(row.id), prefixLength: row.shared_prefix_ids.length,
        base: logits(row.base), adapted: logits(row.adapted), shift: row.baseline_shift,
        l2: row.activations.l2_distance, cosine: row.activations.cosine_similarity,
        baseRecipient: row.base_recipient.map(transfer), adaptedRecipient: row.adapted_recipient.map(transfer),
      })),
    },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/export-causarium.mjs <research-checkout>');
  const evidence = await exportEvidence(process.argv[2]);
  const directory = new URL('../public/media/causarium/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('evidence-v1.json', directory), JSON.stringify(evidence, null, 2) + '\n');
}
