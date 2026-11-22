# Fieldsense website visualization

## Outcome and publication state

Prepared a native Astro exhibit at `/projects/fieldsense/lab/` using the existing
portfolio `Base.astro` layout. The component visualizes the three-model pipeline,
replays a seven-day simulated farm, explains the selected irrigation action,
and compares both water use and unmet demand under MDP and threshold policies.

The page is unlisted and has `noindex` enabled. This source patch does not change
the homepage cards, project directory, existing ISYE course stub, infrastructure,
or production deployment.

## Data provenance

The exhibit uses recorded outputs generated from Fieldsense 1.1.0's existing
Python Random Forest → MILP → finite-horizon MDP pipeline. Synthetic model seed
6501 and weather seed 41 are retained. The model artifact was regenerated from
source; the original serialized model was not loaded or modified. The public
scenario bundle records source SHA-256 hashes, dependency versions, unit
conversions, held-out seasons, and controller assumptions.

Three scenarios are provided: balanced resources, a dry spell, and an infeasible
strict minimum-service allocation. Both irrigation policies receive the same
realized weather for each field. Farm-wide unmet demand is reported as
`sum(field_deficit_mm × field_area_ha × 10)` in cubic metres.

The balanced fixture uses 645 m³ under the MDP and 945 m³ under the rule, with
45.72 m³ and 0 m³ of unmet demand respectively. These are simulated trade-offs
for the recorded scenario, not measured farm savings. The dry-spell fixture
does not assert an MDP improvement; infeasible allocation stops irrigation.

## Regenerating the recorded scenarios

The original Fieldsense v1.1 Python package is the model source; this change only
adds the website exhibit. With that project and its Python dependencies available,
run the included exporter into a temporary output directory:

```sh
python tools/export_scenarios.py /path/to/isye-6501-agriculture --output /tmp/fieldsense-replay
```

The exporter retrains from the seeded source, validates both policies, and records
the runtime versions and source hashes. Compare the outputs and copy only the
reviewed `scenarios.js` to `public/media/fieldsense/`; update its existing SHA-256
pin when intentionally changing the fixture. The per-scenario browser download
includes the same evidence and raw records.

## Static limits

The browser replays precomputed model outputs. It does not train a Random
Forest, rerun the optimizer, infer from live sensor readings, or control
equipment. Controls select a recorded scenario, field, policy, and replay day;
the displayed values remain tied to those outputs. Soil-water storage is
a simplified model state, not a volumetric sensor measurement.

No new runtime dependency, API, Worker, database, subscription, or equipment
connection is required. HTML, CSS, JavaScript, and the scenario bundle are served
by the existing static portfolio. The per-scenario download is generated locally
from the same embedded public dataset.

## Verification

Run the focused public-asset tests with:

```sh
node --test tests/fieldsense-replay.test.mjs
```

The test file follows the existing `npm test` glob. It covers provenance and
feasibility, day-zero and daily totals, reconciliation with Python outputs,
area weighting, water caps, shared weather, action scores, and absence of
irrigation output for infeasible allocation. No DOM or companion JSON file is
required; it executes the exact public scripts in isolated Node VM contexts.

All eight focused tests passed. Browser checks on the preview confirmed desktop
playback and automatic stop at day seven, keyboard slider End/ArrowRight actions,
policy switching, the strict infeasible stop, and full-week dry-scenario totals.
Embedded viewport checks at 390 px and 360 px showed no horizontal overflow of
the visualization root. Dark-theme rendering and loading the exact self-contained
offline artifact also passed.

These checks do not constitute physical-device testing or a full Astro build.
The draft PR should run the existing repository CI before any release decision.
No merge or production deployment is claimed.

## Publication boundary

The patch adds explicit source, asset, route, and SHA-256 entries in the existing
four publication manifests. Existing approvals and guard code are preserved.
New public assets are limited to:

- `media/fieldsense/fieldsense.css`
- `media/fieldsense/fieldsense.js`
- `media/fieldsense/scenarios.js`

The recorded source base is portfolio commit
`e81b2c2760852dcb0345664ae8a228d63663d2b4`. Review any intervening changes before
applying or releasing the patch. Publishing remains a separate owner decision.
