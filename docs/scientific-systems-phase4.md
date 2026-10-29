# Scientific Systems Lab Phase 4 — private development

Development architecture snapshot, 28 October 2026. Branch codex/scientific-systems-phase4. Subsequent explicit publication authorization and license decisions are recorded in `scientific-systems-phase4-release.md`; the pending-release statements below describe the earlier development checkpoint.

## Interactive architecture and reproduction

Astro detail pages mount one C++ demo each. Form validation creates a bounded request; a lazy dedicated module worker loads the generated Emscripten engine. Only C++ performs LU/solve or differentiation. Result/error strings are assigned with textContent; no evaluated user code or injected HTML. Original-domain conditions are mandatory output. Request deadlines terminate and discard the worker; reset creates a fresh instance on next run. Page exit terminates it. A missing artifact produces an actionable error; recorded examples remain explicitly recorded.

Build each engine with its tools/build_wasm.py script (Emscripten 6.0.13) and set `--out` to this site's `public/engines` directory. No hardcoded local source paths are required. Artifacts/manifests are deliberately gitignored pending engine license approval. A clean website checkout therefore has recorded examples plus graceful missing-engine errors until artifacts are built. Production integration must add an explicit reviewed artifact build/fetch step after licenses are approved; current Pages infrastructure is unchanged.

Limits: numerical order16/RHS4, finite magnitude1e100; symbolic256 ASCII bytes,64 nodes/depth32,powers-16..16,literals64digits,growth512,output64KiB. WebAssembly max128MiB,stack1MiB,load20seconds,compute5seconds. Memory limit applies to WASM linear memory, not total browser process memory. UI is single-flight, cancellable and responsive. Native APIs retain their wider existing limits and semantics.

## Release audit and recommendations

Proposed local release repositories: jacobhroutzong/numerical-computing-engine and jacobhroutzong/symbolic-mathematics-engine. Neither is published. Recommend BSD-3-Clause for numerical original additions with applicable LAPACK attribution retained, conservatively treating recovered LU flow as potentially derived. Recommend MIT for the independently authored symbolic code. These are pending recommendations, not applied blanket licenses.

Numerical source-only staging preserves existing source/test hashes in docs/preserved-sources.json; the original workspace remains intact. The curated repository excludes binaries, raw decompilation, REA sessions, datasets, build trees and private evidence. Symbolic has no GMP runtime/code dependency: its base1e9 integers, exact rationals and AST are original designs. A factual GMP research summary is distinct from GMP implementation code; private decompilation remains excluded. GMP's LGPLv3+/GPLv2+ library terms cannot be replaced by our license. NumPy/SymPy are external reference tools, GoogleTest a pinned external test dependency.

Source-license references (not binary evidence): LAPACK v3.12.0 LICENSE at github.com/Reference-LAPACK/lapack; GMP https://gmplib.org/manual/Copying; SymPy1.14.0 LICENSE at github.com/sympy/sympy. Mapping the analyzed LAPACK package to exact upstream source/notices remains a release gate. No license recommendation authorizes original executable redistribution.

Installed SDK license inventory: Emscripten LICENSE offers MIT/NCSA; libcxx,libcxxabi,compiler-rt,libunwind LICENSE.TXT carry Apache2 with LLVM exceptions; musl COPYRIGHT contains MIT and component notices. Preserve complete applicable runtime notices with any generated release. No toolchain archive or runtime bundle is being published in Phase4. Existing KaTeX notices stay intact.

Publication sequence: owner approves names/visibility/license → finalize exact source inventory and upstream/runtime notices → run clean Windows/Linux remote CI → approve engine publication → add reviewed WASM artifact pipeline and notices → approve portfolio deployment. Never commit local dependency caches or secrets. Prepared workflows are unexecuted until explicitly pushed.

## Cloudflare Workers issue — separate investigation

The Workers Builds: portfolio-website check was failing before Scientific Systems changes (pre-release commit1035c9f). Pages project portfolio-site successfully serves the site; Workers service portfolio-website is a separate build integration. Installed Wrangler4.152.0 `whoami` reports unauthenticated; it exposes no builds subcommand. Authenticated Cloudflare build logs are unavailable, so the exact failing command and cause remain unverified. A Worker/static-Pages configuration mismatch is only a hypothesis. Next read-only step: retrieve the failed build log in the existing account, identify the first error and configured build/deploy commands, compare against the known-good Pages build. No login, infrastructure, deployment or recovery changes performed.

## Native extensions after interactive validation

After native/WASM parity and eight browser demo tests passed, the curated numerical repository gained a separate `sce_qr` library. This is independent Householder mathematics, not recovered binary behavior. It returns thin column-major Q and square R for 1 <= columns <= rows <= 256, leaves inputs unchanged, handles zero/dependent columns without claiming rank estimation, and rejects nonfinite inputs or overflowing arithmetic. Tests check A≈QR, QᵀQ≈I, scaling, padded storage and invalid inputs. Wide matrices, least squares and a QR browser interface remain outside this milestone.

The symbolic repository gained `simplify_with_trace` and `check_polynomial_step`. Each trace is at most one aggregate simplification step, certified by exact bounded polynomial normalization of the original and output trees without first simplifying the original. Unsupported partial domains, zero/negative/large powers and growth budgets yield Unknown with no certified step. This is not a per-rule differentiation proof or a general theorem prover. Existing derivative semantics and domain conditions remain unchanged. Both extensions are native-only; the browser modules expose the established solve and differentiation APIs.

Project03 remains architecture and a first-milestone acceptance plan only. Completion report records exact test scopes and outstanding release gates.
