# Portfolio modernization checklist

**Status** is Complete, Partial or Not Started. A feature is never Complete because it is planned, grouped in navigation, or backed by mock data.
**Agent** is Frontend, Codex or Shared.
**Evidence class** says how far the claim is proven:

| Class | Meaning |
|---|---|
| **V** Verified source | Committed on a pushed branch and checked by build, tests or a hosted preview. |
| **R** Codex-reported | Reported by Codex as local or staging work. Not in a synchronized Git checkpoint, so not verified here. Always Partial at most. |
| **D** Deployed | Running on production `jacobroutzong.dev`. Nothing from the redesign branches is deployed. |
| **N** Not started | No implementation exists. |

Evidence links: PR [#8](https://github.com/jacobhroutzong/portfolio-website/pull/8) (draft, `design/portfolio-experience`, code head `fb56e4c`), preview <https://design-portfolio-experience.portfolio-site-bs9.pages.dev>; PR [#9](https://github.com/jacobhroutzong/portfolio-website/pull/9) (draft, stacked on #8, `design/scientific-systems-ui`, code head `20d3bcd`), preview <https://design-scientific-systems-ui.portfolio-site-bs9.pages.dev>. Later commits on either branch change only this checklist. Last updated: release-readiness pass.

## A. Visual redesign and website experience

| Item | Agent | Status | Class | Evidence | Remaining acceptance |
|---|---|---|---|---|---|
| Design tokens, light and dark themes | Frontend | Complete | V | `tokens.css`, `3b033c5`; hosted check | Owner approval of the visual design |
| Homepage, Work page, header and mobile menu | Frontend | Complete | V | PR #8; hosted check; rail fix `748ee9b` | Owner approval; not deployed |
| Contact form | Frontend | Partial | V | One authorized test on the PR #8 preview: the form validated and submitted, and FormSubmit replied that the form is **awaiting email activation**. Delivery is not confirmed | Owner must click the FormSubmit activation email (check inbox and spam for the recipient in `profile.ts`), then one more approved test. Production likely has the same state |
| Scientific Systems detail pages restyled | Frontend | Partial | V | `631db1e`; 8 axe runs clean; CI `verify` passes on `20d3bcd` | Owner review; Scientific index and roadmap page only reskinned by CSS |
| Ascent, project walkthrough pages restyled | Frontend | Not Started | N | They inherit tokens only | Per-page pass |
| Accessibility and responsive checks | Frontend | Partial | V | axe clean on Milestone A and Scientific pages; no overflow at 360 to 1440 px | Repeat per milestone; full manual screen-reader pass |

## B. Portfolio organization and integrated application suites

| Item | Agent | Status | Class | Evidence | Remaining acceptance |
|---|---|---|---|---|---|
| Six collections, seven suites, ten apps, one registry | Frontend | Complete | V | `src/data/collections.ts`, PR #8 | Update as engines land |
| Existing routes preserved | Frontend | Complete | V | Link checker: 3078 references | Keep in CI |
| Crucible and Tunera names, with ModelForge and TuneLedger aliases | Frontend | Complete | V | `collections.ts` header | Renaming needs owner approval |
| Suites as working shared workspaces | Shared | Not Started | N | Suites are navigation groupings only | Shared navigation and state per studio once members are native |
| Future Scientific engines (circuits, compiler, vision, typesetting, visualization) | Shared | Not Started | N | Listed as planning only | Out of scope until requested |

## C. Native functional applications and parameter explanations

| Item | Agent | Status | Class | Evidence | Remaining acceptance |
|---|---|---|---|---|---|
| Numerical engine workbench: examples, per-field units and ranges, live validation, solution, pivot, residual, backward-error views, stale-result protection | Frontend | Partial | V | `631db1e`, `65be082`, `20d3bcd`; unit tests 9/9; 20 scientific e2e pass incl. 4 stale-result regressions; hosted preview rechecked | Owner approval. Optional enhancement for the engine owner: expose L/U factors and Householder QR in the browser build for a live LU/QR comparison |
| Symbolic engine workbench: examples, advisory syntax checks, typeset forms, expression tree, domain conditions, plot with cross-check, stale-result protection | Frontend | Partial | V | Same commits; hosted preview rechecked | Owner approval. Optional enhancement for the engine owner: expose checked rewrite traces in the browser build |
| Decision Intelligence, seven scenarios native | Shared | Not Started | N | Site still opens a hosted demo. Pushed `codex/decision-engine-workbench` has a robotics-only contract and a route that always returns 503 | Current Codex checkpoint, then Milestone B |
| Decision Intelligence workbench and model path as built by Codex | Codex | Partial | R | Codex reports more progress locally than is pushed | Synchronized, sanitized commit with contracts and fixtures |
| EquityScout | Shared | Partial | V | Public calculator uses an invented property; private API fails closed | Parameter guide; owner-data path is Codex |
| Leverline | Frontend | Partial | V | Standalone site, catalog estimates | Remains separate by design |
| Crucible, Tunera, Recursa, Harness² Lab native | Shared | Not Started | N | All open hosted demos | Milestone D |
| Every control explains meaning, units, range, default, effect and uncertainty | Frontend | Partial | V | Done for the two Scientific workbenches only | Apply per app as it goes native |

## D. Security, inference, and cost governance

| Item | Agent | Status | Class | Evidence | Remaining acceptance |
|---|---|---|---|---|---|
| No keys exposed in the frontend | Shared | Complete | V | No inference code or secrets on either branch | Recheck on every branch |
| Preview cannot invoke paid inference | Shared | Partial | V | These branches contain no inference code; EquityScout API returns 503 on preview | **Preview credential-scope verification pending.** The Frontend agent has no Cloudflare dashboard access and did not retrieve or view any secret value. Codex or the owner must confirm in Pages project settings that Preview variables hold no production credentials |
| Private Hugging Face staging | Codex | Partial | R | Reported | Pushed evidence and a documented contract |
| Cloudflare Access and backend authentication | Codex | Partial | R | Reported. Only EquityScout auth is in source (`src/lib/equityscout/auth.mjs`) | Same for the inference route |
| D1 inference safeguards and per-user quotas | Codex | Partial | R | Reported. Only the EquityScout D1 migration is in source | Same |
| Portfolio-wide cost protection | Codex | Partial | R | Reported | Per-route caps, alerts and a kill switch, verified |
| Versioned contracts for all seven scenarios, error states, deterministic fixtures | Codex | Partial | V | Pushed branch has metadata for seven scenarios, robotics-only validators and one fixture | Remaining six scenarios, state definitions, working route |
| Honest unavailable states in the UI | Shared | Partial | V | Scientific workbenches show engine-unavailable and time-limit states; API returns structured `NOT_READY` | Decision Intelligence states in Milestone B |
| Production deployment of the redesign | Shared | Not Started | N | PR #8 is draft | Owner approval, then merge |

## CI status (code heads `fb56e4c` and `20d3bcd`)

| Check | `main` | PR #8 | PR #9 | Notes |
|---|---|---|---|---|
| `verify` (lint, type check, unit tests, build, links, e2e) | n/a | pass | pass | Failed once on PR #9 because of a type error, fixed in `20d3bcd` |
| `docker-smoke` | n/a | pass | pass | |
| Cloudflare Pages (preview and production deploy) | pass | pass | pass | |
| Workers Builds: portfolio-website | **fail** | fail | fail | Pre-existing and isolated, see below |

**Workers Builds failure.** It is a separate Cloudflare *Workers* integration (script `portfolio-website`, production environment) that is distinct from the Pages project `portfolio-site` documented in `docs/CLOUDFLARE-PRODUCTION.md`, which says the site is Pages, not a Workers application. It fails identically on `main`, so it is not caused by these branches. The repository has no Workers deploy configuration for it (the only wrangler file is `wrangler.scout-local.jsonc`). `main` has no branch protection, so it gates nothing. The cause needs the build log in the Cloudflare dashboard, which is not accessible here. Not suppressed or bypassed. Owner decision: fix the build command, or disconnect the Workers integration if it is unintended.

The two Ascent Python-in-browser e2e tests that fail in the local sandbox pass in CI, so they are environmental to the sandbox.
