# Phase 4 validation and release status

Development validation snapshot, 28 October 2026. The following results describe the original local milestone. See `scientific-systems-phase4-release.md` for the 29 October publication review and current source pins.

| Check | Observed result |
| --- | --- |
| Preserved original Numerical workspace | 21/21 CTest entries: 19 native + 2 Python reference tests |
| Curated Numerical repository with QR | 21/21 native entries: 19 preserved LU/solve + 2 new QR |
| Symbolic repository with traces | 12/12 CTest entries: 11 native + 1 Python reference test |
| Native/WASM solve parity | 32 seeded matrices, orders1–16, RHS1/4; tolerance1e-13 scaled; backward error <1e-14 |
| Native/WASM derivative parity | 10 expressions including domain conditions |
| Adapter rejection checks | 5 numerical, 6 symbolic cases |
| Website Node suite | 94 passed, 0 failed |
| Website Vitest suite | 3 files, 20 tests passed |
| Full website Playwright suite | 26 passed, 2 pre-existing mobile Python skips |
| Production-build scientific Playwright tests | 8/8 passed across desktop1440/mobile390 |
| Astro production build | 19 routes; 2883 links/assets checked across74 HTML files |
| Pages function compilation | Existing check:scout passed |
| Automated accessibility | axe-core4.11.0,20 route/theme/viewport combinations;0 violations,0 overflow,0 missing assets |

Native tests include the established NumPy and exact Python/Fraction/SymPy references. Passing counts are entries, not an assertion that every possible input is correct. QR tests check reconstruction/orthogonality, not the original DLL. Trace certification is bounded polynomial normalization, not a formal proof. No original-binary differential execution occurred.

The first browser runs exposed a missing load message and Vite's prohibition on importing public modules through its source transforms. The corrected static module worker passes actual production-build tests. Accessibility initially detected an invalid label on a pre element; assigning a labelled region fixed it, and the full accessibility recheck passed. An existing no-JavaScript test's fixed local port was changed to respect the optional test base URL. Existing website configuration and visual identity are retained.

## Toolchain and reproducibility

Official emsdk manager commit d7b4130688bfa348392b921ab04015aa15c4f154; SDK6.0.13; compiler revision e13ee988ce3d87a738dd8f3661d02223308c412a. SDK LLVM release hash eb132757325583b787fe9414b09afea9442b72ad. Project-local activation only; no permanent PATH edit. SDK Node24.19.0 and Python3.13.3 were installed as SDK components. The native compiler is MSVC19.44 with CMake and external GoogleTest1.17.0.

Each engine's tools/build_wasm.py compiles its actual source and emits module/WASM/source/header/build-script hashes. Follow docs/browser.md; provide your own SDK and source/output arguments. The portfolio's tools/scientific-wasm-parity.mjs accepts the WASM directory and native executable paths as CLI arguments. No absolute personal source path is required by the tracked site. Generated modules remain ignored and local. Prepared GitHub CI is not remotely executed; Linux portability is pending clean CI validation.

## Repository readiness and remaining gates

Portfolio branch: codex/scientific-systems-phase4. Numerical source-only repository: codex/numerical-phase4 (no commit yet). Symbolic: codex/symbolic-phase4. Changes remain uncommitted for review. Numerical docs/preserved-sources.json verifies the preserved original sources/tests; QR additions are separate. Proposed release inventories use Git's tracked/untracked/ignored rules and do not authorize publication. Inspect exact archives again when a release is approved.

Recommend numerical BSD-3-Clause with applicable LAPACK notices retained; symbolic MIT for independently authored material. Owner approval, exact target-to-source provenance/notices and complete generated runtime notices are still required. No original binary, raw decompilation, local reference environment or toolchain is intended for public distribution. A signature/path scan is a useful check, not a guarantee that no secret can exist.

Production remains the deployed Phase3 release. Remote main has advanced independently; reconcile and review those changes on a development branch before any future merge request. Do not force-push or rewrite unrelated history.

Cloudflare Workers root cause remains blocked by missing authenticated build logs; existing Pages compilation succeeding locally does not resolve the separate Workers Builds service failure. See scientific-systems-phase4.md for the read-only diagnostic findings and publication sequence. Project03 remains design only in project03-compiler-architecture.md.
