# Ascent progress

This is the first deployable curriculum slice, not the entire long-term brief. Work is integrated on `codex/ascent-ai-lab-prep`; the production branch and hosting settings have not been changed.

| Milestone | Delivered | Remaining limits |
| --- | --- | --- |
| M0 | Existing Astro stack, inherited theme, responsive layout, lint/types/CI | Astro replaces Next.js; rationale in DECISIONS.md |
| M1 | All eleven exercise categories represented; Monaco + plain editor; disposable Pyodide workers; termination, timeout and output cap; lazy additional tests | Static checks are inspectable; no secure remote runner or measured peak memory |
| M2 | IndexedDB, export/import, mastery/decay, SM-2, XP, streak/freeze, goal, readiness, adaptive placement | Placement is diagnostic and does not skip bosses; readiness weights need calibration |
| M3 | 11 lessons, 66 exercises, 15 problems, source links, schema and solution validation | Later tracks are outlines; early ML units and capstones need expansion; scalar autograd rather than a tensor-compatible teaching framework |
| M4 | Topic/difficulty/profile/status filters, execution, submissions, attempt comparison, hints, editorial | Study profiles are editorial hypotheses, not company questions |
| M5 | Timed coding and ML rounds, phase timings, cumulative counter, story bank, design rubric, debrief | Full half-day mock loops, recordings and rich ML debugging are not built |
| M6 | Keyboard-friendly answer controls, labeled filters, mobile read-only practice editor, Field Radar, project listing/screenshot, deployment/authoring guide, port-7860 Dockerfile and CI smoke job | Docker engine is stopped locally; container verification must run in CI or with Docker running |

## Verification — October 24, 2026

- ESLint and Astro type checks: passed, zero diagnostics.
- Existing portfolio tests: 5 passed. Learning engine tests: 9 passed.
- Reference solutions: all 165 Python checks passed; executable lesson references also passed.
- Numerical checks: 150 independent randomized comparisons with NumPy, deterministic seed 42.
- Production static build: passed; internal links and assets checked across 13 HTML pages.
- Browser checks: 1440 px and 390 px layouts, filters, IndexedDB reload, lesson feedback, full lesson completion, boss completion, and backup/import passed. Python Run/Submit, delayed additional-test requests and a 10-second infinite-loop termination passed after fixing an asynchronous editor-loading race.
- `npm audit`: zero known vulnerabilities after updating dependencies and overriding Monaco's sanitizer with a patched version.
- No production deploy or merge was performed. Full supported commands and explicit limits: docs/ASCENT.md.
