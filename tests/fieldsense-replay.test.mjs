import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the exact published scripts without requiring a DOM or a JSON companion.
const asset = name => new URL('../public/media/fieldsense/' + name, import.meta.url);
const dataContext = { window: {} };
vm.runInNewContext(readFileSync(asset('scenarios.js'), 'utf8'), dataContext);
const data = JSON.parse(JSON.stringify(dataContext.window.FIELDSENSE_DATA));
const modelContext = { module: { exports: {} } };
vm.runInNewContext(readFileSync(asset('fieldsense.js'), 'utf8'), modelContext);
const { potentialYield } = modelContext.module.exports;
// Normalize VM return values into this realm before strict object comparisons.
const summarize = (...args) => JSON.parse(JSON.stringify(modelContext.module.exports.summarize(...args)));
const cumulative = (...args) => JSON.parse(JSON.stringify(modelContext.module.exports.cumulative(...args)));

function near(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected} ± ${tolerance}`);
}

test('three recorded scenarios retain feasibility and trained-model provenance', () => {
  assert.deepEqual(Object.keys(data.scenarios), ['balanced', 'dry_spell', 'strict_limit']);
  assert.equal(data.schema_version, 1);
  assert.equal(data.provenance.kind, 'recorded_synthetic_model_outputs');
  assert.equal(data.provenance.model_seed, 6501);
  assert.equal(data.provenance.weather_seed, 41);
  assert.deepEqual(data.evaluation.training_seasons, [0,1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(data.evaluation.held_out_seasons, [10,11]);
  near(data.evaluation.mae_t_ha, .4704);
  for (const [id, record] of Object.entries(data.scenarios)) {
    assert.equal(record.id, id);
    assert.equal(record.input.fields.length, 3);
    assert.equal(record.result.feasible, id !== 'strict_limit');
  }
});

test('replay accumulates the recorded end-of-day water volumes, including day zero', () => {
  assert.deepEqual(cumulative(data.scenarios.balanced.result, 'mdp'), [0,105,105,195,270,450,555,645]);
  assert.deepEqual(cumulative(data.scenarios.balanced.result, 'rule'), [0,195,270,435,540,645,840,945]);
  assert.deepEqual(cumulative(data.scenarios.dry_spell.result, 'mdp'), [0,105,270,450,720,900,900,900]);
  for (const id of ['balanced', 'dry_spell']) {
    for (const policy of ['mdp', 'rule']) {
      assert.deepEqual(summarize(data.scenarios[id].result, policy, 0), { water: 0, unmet: 0 });
    }
  }
});

test('full-week comparison reconciles the original Python totals and honest trade-offs', () => {
  for (const id of ['balanced', 'dry_spell']) {
    const result = data.scenarios[id].result;
    for (const policy of ['mdp', 'rule']) {
      const final = summarize(result, policy, 7);
      near(final.water, result.comparison[`${policy}_water_m3`], .0051);
      near(final.unmet, result.comparison[`${policy}_unmet_m3`], .00051);
    }
  }
  const balanced = data.scenarios.balanced.result;
  near(summarize(balanced, 'mdp', 7).water, 645);
  near(summarize(balanced, 'mdp', 7).unmet, 45.72);
  near(summarize(balanced, 'rule', 7).water, 945);
  near(summarize(balanced, 'rule', 7).unmet, 0);
  assert.deepEqual(summarize(data.scenarios.dry_spell.result, 'mdp', 7), summarize(data.scenarios.dry_spell.result, 'rule', 7));
});

test('unequal field areas determine volume instead of an unweighted sum of depths', () => {
  // A one-day contract fixture: 5 mm on 1 ha = 50 m³; 10 mm on 3 ha = 300 m³.
  // Equal 2 mm deficits on these fields represent 20 + 60 m³, not 4 mm farm-wide.
  const result = { feasible: true, allocations: [
    { area_ha: 1, simulation: { mdp: { events: [{ irrigation_mm: 5, unmet_demand_mm: 2 }] } } },
    { area_ha: 3, simulation: { mdp: { events: [{ irrigation_mm: 10, unmet_demand_mm: 2 }] } } }
  ] };
  assert.deepEqual(summarize(result, 'mdp', 1), { water: 350, unmet: 80 });
  assert.deepEqual(summarize(result, 'mdp', 0), { water: 0, unmet: 0 });
});

test('field caps, remaining reservoir, and shared-weather comparisons stay consistent every day', () => {
  for (const id of ['balanced', 'dry_spell']) {
    const result = data.scenarios[id].result;
    for (const field of result.allocations) {
      const mdp = field.simulation.mdp.events;
      const rule = field.simulation.rule.events;
      assert.deepEqual(mdp.map(event => event.rain_mm), rule.map(event => event.rain_mm));
      assert.deepEqual(mdp.map(event => event.day), [1,2,3,4,5,6,7]);
      for (const policy of ['mdp', 'rule']) {
        let used = 0;
        for (const event of field.simulation[policy].events) {
          assert.ok([0,5,10].includes(event.irrigation_mm));
          used += event.irrigation_mm;
          assert.ok(used <= field.water_mm);
          near(used + event.water_remaining_mm, field.water_mm);
          assert.ok(event.ending_moisture_mm >= 0 && event.ending_moisture_mm <= 40);
        }
      }
    }
    for (const policy of ['mdp', 'rule']) {
      for (let day = 1; day <= 7; day++) {
        const remaining = result.allocations.reduce((sum, field) => sum + field.simulation[policy].events[day - 1].water_remaining_mm * field.area_ha * 10, 0);
        near(summarize(result, policy, day).water + remaining, result.totals.water_m3);
      }
    }
  }
});

test('recorded chosen actions agree with maximum reward and eligible budget', () => {
  for (const id of ['balanced', 'dry_spell']) {
    for (const field of data.scenarios[id].result.allocations) {
      for (const event of field.simulation.mdp.events) {
        const entries = Object.entries(event.q_values).map(([action, score]) => [Number(action), score]);
        const before = event.water_remaining_mm + event.irrigation_mm;
        assert.deepEqual(entries.map(([action]) => action), [0,5,10].filter(action => action <= before));
        const best = Math.max(...entries.map(([, score]) => score));
        const tied = entries.filter(([, score]) => score === best).map(([action]) => action);
        assert.equal(event.irrigation_mm, Math.min(...tied));
      }
    }
  }
});

test('infeasible scenario retains predictions but exposes no irrigation output', () => {
  const strict = data.scenarios.strict_limit;
  assert.equal(strict.result.simulation, null);
  assert.equal(strict.result.allocations, undefined);
  assert.equal(summarize(strict.result, 'mdp', 7), null);
  near(potentialYield(strict), potentialYield(data.scenarios.balanced));
  near(strict.input.fields.reduce((sum, field) => sum + field.area_ha * 300, 0), 1620);
  assert.equal(strict.input.resources.water_m3, 650);
  assert.equal(strict.input.minimum_service, 'full');
});

test('public fixture provenance contains relative source hashes and no private path or account references', () => {
  const text = JSON.stringify(data.provenance);
  assert.doesNotMatch(text, /\/workspace\/|\/home\/|\/mnt\/|[A-Za-z]:[\\/]|libfile_|file_000|download_url|completion_token/);
  for (const [source, digest] of Object.entries(data.provenance.source_sha256)) {
    assert.match(source, /^src\/agriculture\/[a-z]+\.py$/);
    assert.match(digest, /^[0-9a-f]{64}$/);
  }
});
