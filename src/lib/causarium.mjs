import { z } from 'zod';

export const researchCommit = '08d3457da3ec65256cf96d133ecd45541220adf6';
export const sourceDigests = Object.freeze({
  'pythia-001.json': '0a357fdbe71c891f2f1606451b1626fefdd8edc721b4d61330880b8daf385160',
  'pythia-selective-001.json': 'b9dfb03db528b4bbd2804743ac1d828067dbd8802ce624bb4c8982e6da912f4e',
  'pythia-donor-specificity-001.json': 'aba858db815f84cbac2008f90c19d84adafc8671960c3dfe660ee86b5b40aaf0',
  'qwen35-training-transfer-001.json': '4a5ca66ddb9352839c1e06d0188fa624e8ea01f2e498ec190b8736abf7575415',
});

const obj = z.strictObject;
const num = z.number();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const pythiaRevision = z.literal('de3e4e2d6cbb3b1a51f90fe153ea51fcd8c7c852');
const qwenRevision = z.literal('15852e8c16360a2fea060d615a32b45270f8a8fc');
const italy = z.literal('capital-france-italy');
const germany = z.literal('capital-france-germany');
const pair = z.union([italy, germany]);
const pairOrder = rows => rows[0]?.id === 'capital-france-italy' && rows[1]?.id === 'capital-france-germany';
const baseMargins = { clean: num, corrupt: num };
const patch = obj({ sham: num, margin: num, delta: num });
const patchMatches = (score, corrupt) => score.sham === corrupt && score.margin - corrupt === score.delta;
const logits = { numeric: num, quoted: num, margin: num };
const marginMatches = score => score.numeric - score.quoted === score.margin;
const donor = obj({
  id: z.enum(['sham', 'matched-clean', 'capital-spain', 'capital-japan', 'name-france', 'name-alice']),
  margin: num, delta: num,
});
const transfer = obj({
  condition: z.enum(['identity_sham', 'matched_transfer', 'other_prompt_transfer']),
  donorState: z.enum(['base', 'adapted']), donorCase: z.enum(['arithmetic-a', 'arithmetic-b']),
  donorIndex: z.union([z.literal(30), z.literal(31)]), positionId: z.literal(31),
  ...logits, delta: num,
});

export const evidenceSchema = obj({
  schemaVersion: z.literal(1),
  researchCommit: z.literal(researchCommit),
  offlineTests: z.literal(26),
  pythia: obj({
    model: z.literal('EleutherAI/pythia-70m'),
    revision: pythiaRevision, tokenizerRevision: pythiaRevision,
    whole: obj({
      sourceSha256: z.literal(sourceDigests['pythia-001.json']),
      configSha256: digest, layer: z.literal(3), seed: z.literal(42), seconds: num,
      rows: z.array(obj({ id: z.union([pair, z.literal('water-hot-cold')]),
                         ...baseMargins, ...patch.shape })).length(3),
    }),
    selective: obj({
      sourceSha256: z.literal(sourceDigests['pythia-selective-001.json']),
      configSha256: digest, promptsSha256: digest, seed: z.literal(42),
      layers: z.tuple([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      positions: z.tuple([z.literal('The'), z.literal('capital'), z.literal('of'), z.literal('country'), z.literal('is')]),
      rows: z.array(obj({ id: pair, ...baseMargins,
                         matrix: z.array(z.array(patch).length(5)).length(6),
                         controls: z.array(obj({ full: patch, mismatched: patch })).length(6) })).length(2),
    }),
    donor: obj({
      sourceSha256: z.literal(sourceDigests['pythia-donor-specificity-001.json']),
      configSha256: digest, layer: z.literal(1), position: z.literal(3), seed: z.literal(42),
      rows: z.array(obj({ id: pair, ...baseMargins, interventions: z.array(donor).length(6) })).length(2),
    }),
  }),
  qwen: obj({
    model: z.literal('Qwen/Qwen3.5-2B'), revision: qwenRevision, tokenizerRevision: qwenRevision,
    sourceSha256: z.literal(sourceDigests['qwen35-training-transfer-001.json']),
    weightsSha256: digest, tokenizerSha256: digest, templateSha256: digest,
    adapterSha256: z.literal('c96c07dc20253ac40d0c74762885714c77d73e3b1d919ca665954a1ebb773ef7'),
    adapterConfigSha256: digest, adapterRank: z.literal(8), adapterStep: z.literal(20),
    layer: z.literal(11), positionId: z.literal(31), seed: z.literal(42), dtype: z.literal('bfloat16'),
    runtime: obj({ python: z.literal('3.12.3'), torch: z.literal('2.9.1+cu128'),
                   transformers: z.literal('5.13.0'), peft: z.literal('0.20.0'),
                   seconds: num, peakAllocatedBytes: num }),
    rows: z.array(obj({
      id: z.enum(['arithmetic-a', 'arithmetic-b']), prefixLength: z.union([z.literal(31), z.literal(32)]),
      base: obj(logits), adapted: obj(logits), shift: num, l2: num, cosine: num,
      baseRecipient: z.array(transfer).length(3), adaptedRecipient: z.array(transfer).length(3),
    })).length(2),
  }),
}).refine(data => {
  const { whole, selective, donor: donors } = data.pythia;
  if (!pairOrder(whole.rows) || whole.rows[2].id !== 'water-hot-cold' ||
      !pairOrder(selective.rows) || !pairOrder(donors.rows)) return false;
  if (!whole.rows.every(row => patchMatches(row, row.corrupt) && row.margin === row.clean)) return false;
  if (!selective.rows.every(row => row.matrix.flat().every(score => patchMatches(score, row.corrupt)) &&
      row.controls.every(({full, mismatched}) => full.margin === row.clean &&
        patchMatches(full, row.corrupt) && patchMatches(mismatched, row.corrupt)))) return false;
  const donorOrder = 'sham,matched-clean,capital-spain,capital-japan,name-france,name-alice';
  if (!donors.rows.every((row, i) => row.interventions.map(d => d.id).join(',') === donorOrder &&
      row.interventions[0].delta === 0 &&
      row.interventions[1].margin === selective.rows[i].matrix[1][3].margin &&
      row.interventions.every(d => d.margin - row.corrupt === d.delta))) return false;
  return data.qwen.rows.every((row, i, cases) => {
    if (row.id !== ['arithmetic-a', 'arithmetic-b'][i] || row.prefixLength !== 31 + i ||
        !marginMatches(row.base) || !marginMatches(row.adapted) ||
        row.adapted.margin - row.base.margin !== row.shift) return false;
    return ['base', 'adapted'].every(state => {
      const baseline = row[state];
      const opposite = state === 'base' ? 'adapted' : 'base';
      return row[state + 'Recipient'].every((score, j) => {
        const source = j === 2 ? cases[1 - i] : row;
        return score.condition === ['identity_sham', 'matched_transfer', 'other_prompt_transfer'][j] &&
          score.donorState === (j === 0 ? state : opposite) && score.donorCase === source.id &&
          score.donorIndex === source.prefixLength - 1 && marginMatches(score) &&
          score.delta === score.margin - baseline.margin &&
          (j !== 0 || (score.numeric === baseline.numeric && score.quoted === baseline.quoted));
      });
    });
  });
}, 'Unexpected experiment ordering, margin arithmetic, or control relationship');
