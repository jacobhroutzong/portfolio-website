# Ascent progress

This is the first deployable curriculum slice, not the entire long-term brief. Work is integrated on `codex/ascent-ai-lab-prep`; the production branch and hosting settings have not been changed.

| Milestone | Delivered | Remaining limits |
| --- | --- | --- |
| M0 | Existing Astro stack, inherited theme, responsive layout, lint/types/CI | Astro replaces Next.js; rationale in DECISIONS.md |
| M1 | All eleven exercise categories represented; Monaco + plain editor; disposable Pyodide workers; termination, timeout and output cap; lazy additional tests | Static checks are inspectable; no secure remote runner or measured peak memory |
| M2 | IndexedDB, export/import, mastery/decay, SM-2, XP, streak/freeze, goal, readiness, adaptive placement | Placement is diagnostic and does not skip bosses; readiness weights need calibration |
| M3 | 11 lessons, 66 exercises, 20 problems, 24 references and 24 interview questions, source links, schema and solution validation | Later tracks are outlines; early ML units and capstones need expansion; scalar autograd rather than a tensor-compatible teaching framework |
| M4 | Topic/difficulty/profile/status filters, execution, submissions, attempt comparison, hints, editorial | Study profiles are editorial hypotheses, not company questions |
| M5 | Timed coding and ML rounds, phase timings, cumulative counter, story bank, design rubric, debrief | Full half-day mock loops, recordings and rich ML debugging are not built |
| M6 | Keyboard-friendly answer controls, labeled filters, mobile read-only practice editor, Field Radar, project listing/screenshot, deployment/authoring guide, port-7860 Dockerfile and CI smoke job | Docker engine is stopped locally; container verification must run in CI or with Docker running |

## Verification — October 24, 2026

- ESLint and Astro type checks: passed, zero diagnostics.
- Existing portfolio tests: 5 passed. Learning engine and knowledge tests: 11 passed.
- Reference solutions: all 220 Python checks passed; executable lesson references also passed.
- Numerical checks: 150 independent randomized comparisons with NumPy, deterministic seed 42.
- Production static build: passed; internal links and assets checked across 12 HTML pages.
- Browser checks: 1440 px and 390 px layouts, filters, IndexedDB reload, lesson feedback, full lesson completion, boss completion, and backup/import passed. Python Run/Submit, delayed additional-test requests and a 10-second infinite-loop termination passed after fixing an asynchronous editor-loading race.
- `npm audit`: zero known vulnerabilities after updating dependencies and overriding Monaco's sanitizer with a patched version.
- No production deploy or merge was performed. Full supported commands and explicit limits: docs/ASCENT.md.
- GitHub CI verified the Docker build and HTTP service on port 7860. Cloudflare Pages built and published the branch preview automatically. A Linux CI persistence race was fixed by waiting for the IndexedDB transaction before confirming settings are saved; the regression test waits for that durable confirmation before reloading.
- A separate existing Cloudflare Workers build integration reports failure. Its detailed logs require signing in to Cloudflare; no account settings or authentication were changed. The static Pages preview works independently.

## Advanced focus and public Space

The default workspace assumes intermediate Python and ML knowledge. Six domains, four study paths, searchable sourced references, original interview rubrics, bookmarks, notes, and spaced retrieval are implemented. Foundation lessons remain optional. Five added coding problems cover stable log-sum-exp, cross-entropy, token-weighted gradient accumulation, AdamW, and bounded KV storage.

Public Static Space: https://huggingface.co/spaces/jacobroutzong/ascent. The compiled build is packaged with `npm run package:space`; GitHub remains the editable source. Space uploads are separate from Cloudflare deployment. Browser-local progress is separate for each host. Desktop/mobile end-to-end suite: 10 passed, 2 intentionally skipped mobile Python-editor flows.
