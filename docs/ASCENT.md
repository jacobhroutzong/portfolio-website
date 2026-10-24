# Ascent

Ascent is integrated into this repository at `/ascent/`, with an entry on the portfolio home and Work pages. It uses the site's cream/forest-green palette, Georgia headings, dark theme, and existing static Astro build. See `DECISIONS.md` for the deliberate change from the proposed Next.js stack.

## Start

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4321/ascent/`. Python's first use downloads Pyodide 0.29.5 from jsDelivr; NumPy exercises download an additional package. An initial connection is required. Lessons and previously visited app assets are cached for offline use. Progress is local to this browser and origin; use **Your progress → Export** before moving to a production URL.

## What is implemented

- 11 lessons with 66 original exercises: four initial foundations lessons plus a coding/testing workshop; hashing, matrix shapes, chain rule, scalar autodiff, stable softmax and attention.
- All eleven exercise categories have examples, including a bug selection plus executable fix and cumulative multi-part code. Wrong answers reappear, mistakes are categorized, and self-assessment reveals a rubric after a written attempt.
- 29 original problems, each with 3 visible and 8 additional practice checks, reference implementations, three hints, editorials, and complexity notes. Monaco on desktop, a plain-editor alternative, and read-only saved code on phones.
- IndexedDB progress, SM-2 reviews, mastery with separate-day evidence and decay, XP, goal, weekly streak freeze, badges, backups, activity history, and transparent readiness heuristics.
- Adaptive 20-question placement for diagnosis. It does not certify mastery or automatically skip prerequisite bosses.
- Timed coding and attention rounds, phase tracking, a three-stage evolving counter, a story bank, and a written system-design exercise with a self-assessment rubric.
- Field Radar with dated sources and clearly labeled unverified interview hypotheses.

## Deliberate limits and remaining brief items

This release is the first working content slice. It does not claim the entire 6–12 month curriculum is complete. Tracks 2, 4, and 7–11 have objectives and outlines, not lessons. Units in the early ML slice are smaller than the final 4–8 lesson units requested in the brief. The Foundations CLI capstone and 40-problem coding capstone are future extensions.

The autograd implementation is a **scalar teaching engine**, not a NumPy tensor/PyTorch-compatible framework. Real PyTorch/GPU execution, symbolic answer grading, recording, fully simulated half-day lab loops, ML debugging traces, AI-assisted defense, optional API grading, and formal lab-specific readiness calibration are not implemented. No API keys are collected. Math exercises in this slice use numeric grading.

Static additional test files are requested only on Submit or Give up. Anyone can inspect static files or their worker, so this is not a secure assessment. The runner reports wall time including setup; browser peak Python memory is unavailable. A future remote sandbox must isolate network, CPU, memory and filesystem and hold hidden tests server-side. The `Runner` interface isolates that future change.

## Verify

CI installs Python 3.12 and NumPy, then runs:

```sh
npm run verify
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run verify` includes the existing portfolio tests, Ascent engine tests, the shared Zod schemas, execution of all original reference solutions (319 checks), lesson code references, 150 deterministic randomized numerical comparisons against independent NumPy operations, the static build, and internal link validation. Set `ASCENT_PYTHON` to your Python executable if it is not `python3`.

On Windows PowerShell:

```powershell
$env:ASCENT_PYTHON = 'C:\path\to\python.exe'
npm run verify
```

Only trusted authored reference code is run by the validator. Learner code executes in a disposable browser Web Worker, never the build process.

## Deploy

Keep the existing Cloudflare Pages configuration: repository root, build command `npm run build`, output `dist`, Node 24, `SITE_URL=https://jacobroutzong.dev`. No new secrets, adapters, accounts, or database are needed. After review and merge into the configured production branch, the app is served at `https://jacobroutzong.dev/ascent/`. This change does not modify DNS or hosting settings.

For any static host, upload `dist/` from `npm run build`. Paths are origin-relative, so serve the portfolio at the domain root. No Next.js export command is needed: Astro's output is already static.

For a Hugging Face Docker Space, use this repository's Dockerfile and port 7860. Space metadata in its README should specify `sdk: docker` and `app_port: 7860`:

```sh
docker build -t ascent .
docker run --rm -p 7860:7860 ascent
```

Open `http://localhost:7860/ascent/`. The container serves the entire portfolio. A separate Space will have separate browser-local progress. The Docker daemon must be running to build and verify the container.

The Docker build and HTTP smoke check also run in GitHub Actions and passed for the initial branch. Cloudflare Pages automatically publishes branch previews. A separate Workers integration may report an independent failure; diagnose that integration in Cloudflare rather than changing the working Pages deployment.

## Add content in five minutes

1. Copy a lesson object in `content/tracks/lessons.yaml`. Choose a unique slug and track, write an objective, prerequisites, a concept under 150 words, primary-source URL, recap, and 6–12 exercises. Each exercise needs a unique ID, type, prompt, answer and explanation. Executable items include `code`, `tests`, and `reference`; multi-part items also include cumulative `stages`.
2. For a problem, copy an entry in `content/problems/library.yaml`. Provide the original statement, constraints, examples, signature, starter, visible checks, hints, editorial, mistakes and complexity. Add `content/solutions/<id>.json` with `reference` and at least 8 `hidden` checks, then generate its public checks file with `npm run sync:ascent`.
3. Run `npm run validate:ascent`, `npm run test:ascent`, and `npm run build`. Content appears automatically; no UI change is needed.

The `.yaml` files currently use JSON-compatible YAML syntax and support ordinary YAML through the parser. `tools/seed-ascent.mjs` is the original authoring seed, **not** a build step. Do not re-run it after editing content unless intentionally regenerating the seed. Add source and `last_verified` together when updating `content/labs/profiles.yaml`.

## Highest-value next steps

1. Expand the early math, coding, and ML units into a reviewed sequence with more independent spaced-retrieval evidence.
2. Add a remote sandbox for real PyTorch and trusted hidden tests, then validate a tensor autograd teaching framework against PyTorch.
3. Add longer role-specific mock loops and calibrate readiness against the learner's recorded timed performance, with dated recruiter-confirmed formats.

## Advanced knowledge and Hugging Face

The home screen now prioritizes 30 technical references and 30 original interview questions across six AI domains, four study paths, and 29 coding problems. Foundation refreshers remain available. Content lives in `content/knowledge/library.json`; references include primary sources and verification dates. Self-rated retrieval schedules reviews and does not certify mastery.

The public Space uses the free Static SDK: https://huggingface.co/spaces/jacobroutzong/ascent. After `npm run build`, run `npm run package:space` and upload the three files in the printed folder to the Space repository root. The dependency-free Node build restores the verified static assets and nested directories from the bundled snapshot. This does not require running a development server. `npm run dev` is only a local editing preview. The Space is a compiled snapshot; future GitHub changes need a fresh build/upload. Progress stays in each browser origin; export/import transfers it between hosts. PyTorch and server-side model inference are not included.

The live Space currently uses the source-based configuration in `docs/SPACE_README.md`: its free static build clones the public portfolio branch, builds the app, and installs the Space entry redirect. To deploy a future GitHub revision, update/recommit the Space configuration to trigger a build. The compiled `package:space` snapshot remains an alternative for uploads.

## Curriculum refinement: implementation and evidence

The current content pass adds assistant-only label construction, paired outcomes,
retrieval metrics, idempotency replay, safe trajectory scoring, low-rank adapter
arithmetic, a uniform toy quantizer, context budgeting, and stable DPO loss.
Each has visible checks plus additional lazy-loaded checks. Primitive exercises
are labeled **prerequisite drills** when they do not directly test the attached
advanced concept; passing one does not establish application evidence.

Six new notes cover tokenizer/loss boundaries, QLoRA precision, context/durable
state, MCP permissions, profiling/distributed-execution decisions, and reasoning
verifiers. The quantizer is explicitly not NF4/GGUF. The verifier lesson does
not implement GRPO or imply a measured training outcome. All 30 interview
questions now have concept-specific rubrics.

`content/knowledge/paths.json` defines the study paths and external project
checkpoints for ModelForge, AdaptForge and Sentinyl/ModelGuard. Paths follow
prerequisite order and remain freely navigable. Use **Study paths → Use this
study path** to save a local preference; the home recommendation and Readiness
next steps follow it. The default advanced path starts with attention, not an
assumed Python deficit. Company-weighted scores remain editorial heuristics.

Progress shows self-assessed mechanism recall, self-assessed interview explanation,
latest independent application-check pass, and recall on separate calendar days
as different signals. A failed recall makes the explanation eligible for review
again; hinted or failed latest application submissions do not count as independent
code evidence. Local browser checks are inspectable and do not certify external
project, deployment or GPU outcomes. The historical independent code-coverage
component is no longer capped by the 20-submission window; that recent window
still applies to timed-round performance.

The version-1 progress format accepts optional `studyPath` and
`conceptRecallDates` fields. Older backups remain importable; unknown path IDs
fall back to the transformer path. Dates are recorded only by successful concept
recall, not by merely visiting a page. Old backups do not invent historical recall
dates. Export before moving between the preview, portfolio and Space origins.

Graph validation checks unknown links, duplicate IDs, cycles, and prerequisite
order inside each path. Content checks execute 319 Python checks plus the
existing 150 seeded NumPy comparisons. Future topics such as MoE/MLA, deeper
DDP/FSDP labs, robotics and RF remain specialization extensions; prioritize the
listed project checkpoints before expanding them. The original seed scripts
are one-time scaffolding and must not overwrite these authored content files.

### Validation of this content pass

`npm run verify` passed: lint, Astro diagnostics (zero errors/warnings), five
portfolio unit tests, 20 Ascent unit tests, 319 Python practice checks, 150 seeded
numerical comparisons, production build and 134 internal link/asset references.
The build retains a non-fatal large-chunk advisory.

`npm run test:e2e` passed 14 desktop/mobile browser tests. Two existing mobile
Python execution flows are intentionally skipped; their desktop equivalents
passed. The four new desktop/mobile curriculum cases verify path persistence,
advanced recommendations and application-versus-prerequisite exercise labels.
GPU project checkpoints remain assignments, not executed training results.
