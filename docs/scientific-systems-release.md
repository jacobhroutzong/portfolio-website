# Scientific Systems Lab release audit — 2026-10-26

The first website release was prepared from production main `768c7d3`, preserving the latest Harness Lab navigation. The Phase 2 branch also contained unrelated unpublished EquityScout backend commits; those commits and their infrastructure/dependency changes are excluded from this release.

## Scope and evidence

Three new routes: `/labs/scientific-systems/`, `/labs/scientific-systems/numerical/`, and `/labs/scientific-systems/symbolic/`. The homepage Selected projects section and Projects listing link to the hub. Seven typed registry entries distinguish two engines in progress from five planning entries. Interactive controls reveal recorded native C++ output; they do not execute a live C++ or Python engine.

The numerical implementation combines REA-backed DGETRF2 control flow with independently implemented scalar operations and a new multi-RHS solve. The symbolic core is independently designed mathematics; the narrow GMP backend observation is not a complete CAS reconstruction. No proprietary Wolfram algorithms or original-DLL behavioral equivalence are claimed. REA identifiers, target digests and limitations are displayed separately from mathematical validation.

The published accuracy figures match the retained local reference reports. The benchmark is explicitly the 2026-10-25 API-level LU/logdet measurement, with seven samples per size and unequal C++/NumPy overheads. No new solve or symbolic performance claim is made.

## Exact validation results

| Check | Result |
|---|---|
| Production-based `npm run verify` | Passed with existing `ASCENT_PYTHON` environment override |
| Astro diagnostics | 0 errors, 0 warnings, 0 hints |
| Node tests | 11 passed, 0 failed |
| Vitest | 20 tests passed across 3 files |
| Ascent Python validation | 319 checks passed |
| Independent Ascent numerical validation | 150 seeded NumPy comparisons passed |
| Full Playwright suite | 18 passed, 2 existing mobile Python tests skipped |
| Final lab-specific responsive checks | 4 passed |
| Final production build | 18 pages; 239 links/assets checked across 19 HTML pages |
| axe-core 4.11.0 | 0 automated WCAG-tagged violations over 20 route/viewport/theme combinations |
| Production-preview assets and layout | No missing local responses or horizontal page overflow observed |
| Numerical engine | 21/21 CTest entries passed; 98 solve reference cases |
| Symbolic engine | 10/10 CTest entries passed; 366 exact-reference cases |

The earlier “89 / 20 passed” meant 89 Node tests plus 20 Vitest tests. The 89 included 78 Node tests for the unrelated, unpublished EquityScout backend. The production-based release correctly has 11 Node tests plus 20 Vitest tests; no lab test was removed.

Keyboard navigation and recorded controls were checked. Audit fixes underline the existing homepage inline activity link, make horizontally scrollable evidence/benchmark tables focusable, and give the investigation group an explicit role. Automated checks are not a comprehensive accessibility certification; diagram/formula text also received manual review. The site retains its existing visual identity.

## Publication review

Only original portfolio text/components/styles, small synthetic recorded examples, dated measurement summaries, tests and documentation are included. No original DLL/executable/archive, raw decompilation, REA bundle, local environment, dataset, machine configuration, credential or hardcoded local user path is included. Pattern scans and explicit file review were performed. Generated build output, test screenshots and audit tool installations are excluded.

KaTeX 0.19.1 is an existing site dependency. Its MIT notice and the KaTeX fonts notice are retained at `/media/scientific-systems/THIRD_PARTY_NOTICES.txt`. No original GMP/LAPACK binary or source implementation is redistributed by these pages. The owner explicitly authorized publication of the reviewed portfolio material.

The symbolic source-only local commit is `aacd48946319c10c6c2e4a00d2c54eeb4d4a55a4` on `codex/symbolic-core`. Its raw research records and decompiled excerpts remain preserved locally outside the index. No engine remote was created. Original-work license, repository name and intended visibility still need owner approval before standalone GitHub publication. The numerical workspace and original LU file hashes were preserved.

Deployment configuration, production infrastructure, dependency manifests, site profile settings and unrelated histories are unchanged. The existing site-wide noindex behavior and large-chunk build advisory remain outside this release's scope. Publishing uses a normal fast-forward push to the existing main branch, followed by live HTTPS/content verification; no force-push is permitted.
