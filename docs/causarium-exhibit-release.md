# Causarium exhibit release candidate

Route `/projects/causarium/` is a static Astro exhibit linked from the home and Projects lists. The branch changes public presentation only. Causarium remains an independent research checkout at `08d3457da3ec65256cf96d133ecd45541220adf6`.

## Evidence review

- The exporter checks the four byte-level source digests before parsing, accepts only measured source records at schema version 1, and constructs the public projection by explicit field selection.
- The strict projection schema checks model pins, dimensions, margin arithmetic, identity shams, donor identities and cross-run agreement. The portfolio's repository, source and build boundary checks allowlist the exhibit and independently pin the public JSON.
- Public evidence contains the measured Pythia matrices, donor comparisons, Qwen candidate logits, scalar activation comparisons, and experiment configuration and provenance digests. Raw prompt token sequences, activation vectors, private Tunera data and checkpoints, machine paths, and logs stay in the independent research environment.
- M4 is described as compatibility work. The measured Qwen comparisons come from M5. Control donors and unresolved specificity appear alongside positive effects.

To regenerate from the independently reviewed source, run `node scripts/export-causarium.mjs <research-checkout>` in the portfolio checkout. A changed source hash aborts the export. A reviewed evidence update needs a new provenance review and a new or updated asset pin.

## Candidate verification

The independent checkout passed all 26 offline tests and remained clean. Portfolio verification passed lint, Astro diagnostics, 18 Node tests, the static build, link checks, and all three publication boundaries. All 28 Playwright cases passed against the built site at desktop and mobile widths. The exhibit cases exercised native disclosures without JavaScript, keyboard scrolling in a wide mobile table, home and Projects discovery, and existing public research routes. The 390 px visual review showed all five heatmap columns together.

## Release gate and rollback

1. The accepted candidate `df5c248d4cf27666ebe5303dec2128d1c39619fd` was reviewed against `b982c89319846d9aff1480b17cde442409a83c99`. The release branch applies that candidate to GitHub `main` at `c95504e4a9e731aec25f7d7d608deedf73a0ad40`, its pre-release Git rollback reference. Run `npm ci`, `npm run verify` and `npm run test:e2e` with the installed Playwright Chromium engine. Confirm the tablet and phone tables scroll within their labelled regions and the exhibit works with JavaScript disabled.
2. Keep the candidate local until explicit approval. Before any approved release, refresh the upstream base, rerun verification, and record the current production deployment in Cloudflare Pages. The existing `main` build may deploy automatically on merge.
3. After Cloudflare reports a successful production deployment, record its deployment ID and Git commit alongside the previously recorded Cloudflare rollback ID. Check `/projects/causarium/`, the homepage and Projects links, the keyboard-accessible tables and disclosures with JavaScript disabled, and the SHA-256 of the live evidence JSON against the public asset pin.
4. If a released exhibit needs rollback, restore the prior successful production deployment in the existing Cloudflare Pages project and revert the exhibit change on `main` through the normal history-preserving workflow. Verify the home, Projects, Tunera, Recursa, Harness², and lab routes and the removal of the exhibit links. The branch changes no runtime service or migration.

The existing portfolio-wide profile readiness guard still sets noindex and keeps the sitemap empty. The exhibit follows that guard and remains reachable by its direct URL and site navigation.

## Source snapshot verification for the Empirava consolidation

The owner-local Causarium Git checkout was clean at the cited revision. Git object verification passed, and the exporter regenerated the public JSON byte for byte from all four digest-verified source records. The public JSON SHA-256 remains `232561831ace6f8c35b4fc4feda4730a3c69494e5ed6701879d836e361cfbbbd`.

The checkout has no configured remote. The separate M0 starter ZIP contains starter code and tests. It predates the measured records and contains no Git history. An independent restorable backup of the M5 revision was not verified. Exact Qwen retraining also remains limited by the training-source mismatch documented in the exhibit.
