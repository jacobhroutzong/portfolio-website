# Scientific Systems Lab Phase 4 release

Release review, 29 October 2026. Scope: publish the two existing C++ engines and their validated interactive demos. No Phase5 or Project03 implementation is included. The previous Phase4 documents retain their dated local-development results.

## Source provenance and license decisions

- Numerical: https://github.com/jacobhroutzong/scientific-numerical-engine, commit `a6b8ad1670328f955f7175a16d13c0c8351c0697`. BSD-3-Clause for original additions, with the full LAPACK3.12.0 notice retained for adapted LU control flow. The review compares the complete LU implementation to the permissively licensed official DGETRF2 source. This resolves the source-only release gate without asserting exact binary/source equivalence or authorizing research-DLL redistribution. Solve and Householder QR are independently implemented.
- Symbolic: https://github.com/jacobhroutzong/symbolic-math-engine, commit `03ea8e5537d3101900b4294a7e1a43eb6472f813`. MIT for independently implemented base10^9 integers, exact rationals, AST/parser, differentiation and checked simplification traces. No GMP, Wolfram or Octave implementation is embedded or linked. Private raw decompilation remains excluded.

The exact source-only inventories include licenses, authored source/tests/docs and CI. Scanning found no research DLL/executable, local dataset, private-key/token signature or personal Windows path in those inventories. Heuristic scanning does not prove every possible secret absent. Original binary execution/differential equivalence remains unperformed.

Official license/source references: https://github.com/Reference-LAPACK/lapack/blob/v3.12.0/LICENSE and https://github.com/Reference-LAPACK/lapack/blob/v3.12.0/SRC/dgetrf2.f. These are source review references, separate from prior REA evidence. All applicable notices are retained; no endorsement is implied.

## CI and artifact identity

Numerical GitHub Actions run https://github.com/jacobhroutzong/scientific-numerical-engine/actions/runs/40863898279 passed native Ubuntu, native Windows and WASM jobs. Native CI runs21 GoogleTest entries (19 LU/solve +2 QR); the two optional NumPy reference entries are not configured in CI.

Symbolic run https://github.com/jacobhroutzong/symbolic-math-engine/actions/runs/40863913196 passed the same three jobs. Native CI runs11 GoogleTest entries; the independent Python/SymPy reference is additional locally, making12 local entries. No original numerical DLL is executed by these workflows.

Browser modules are built from clean source commits using Emscripten6.0.13. Each manifest records the source commit, clean-tree flag, canonical-LF source/header/build-script SHA-256 hashes, compiler flags and binary/module hashes. `scripts/check-scientific-engines.mjs` verifies bundled bytes against the reviewed release manifest; `--remote` additionally verifies all16 source/header/build-script entries against immutable public Git commit URLs. Website CI performs this remote verification.

`public/engines` contains only the two generated module/WASM pairs, their manifests and required notices. These small generated runtimes are intentionally included so the existing Pages build needs no compiler download, secrets or infrastructure change. Source pins are in `src/data/scientific-engine-release.json` and the public `/media/scientific-systems/release.json`. Before updating any bundle, rebuild from a reviewed clean source commit, run native/WASM parity and browser tests, regenerate pins/notices, and review the changed hashes.

Full Emscripten/Node, musl, LLVM libc++/libc++abi/compiler-rt/libunwind notices are retained in `/engines/notices/`, along with the allocator permission notice and engine/LAPACK licenses. No optional ports or research DLLs are linked. Existing KaTeX notices remain intact.

## Deployment and remaining boundaries

The release branch merged current origin/main without rewriting unrelated commits, preserving newer ModelForge/TuneLedger projects, repository aggregation, homepage project expansion and activity workflows. Existing Cloudflare Pages build/deployment remains the publication path. The separate pre-existing Workers Builds integration is outside this release and remains unchanged.

Both demos use real C++ WebAssembly in a dedicated worker. There is no JavaScript mathematical fallback. The UI retains resource limits, cancellation, explicit errors, original-domain conditions and clearly labelled recorded reference examples. QR and aggregate checked simplification traces remain native-only. Project03 remains an architecture document.

Local release validation after reconciling origin/main:98 Node tests,20 Vitest tests,26 Playwright passes with2 existing mobile Python skips; Astro0 errors/0 warnings/3 existing hints;21 routes and2911 link/asset references across76 HTML pages. Native/WASM parity again passed32 matrix and10 derivative cases. Automated axe4.11 checks passed20 route/theme/viewport combinations with0 violations/overflow/missing assets. Arbitrary-input production-preview checks solved a new matrix to[3,2], differentiated x^4+7*x, retained x^0's condition and handled singular/unsupported inputs at1440px and390px, with successful real WASM requests.

Final portfolio CI, deployed commit and live-browser observations are reported after deployment; earlier local results are in scientific-systems-phase4-results.md.
