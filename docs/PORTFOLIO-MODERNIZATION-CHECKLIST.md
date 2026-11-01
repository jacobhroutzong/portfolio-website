# Portfolio modernization checklist

Status: **Complete** (verified), **Partial**, **Not Started**. Planned, grouped, or mock-data features are never Complete.
Agents: **Frontend** (design agent), **Codex** (backend, inference, security), **Shared**.
Evidence: PR [#8](https://github.com/jacobhroutzong/portfolio-website/pull/8) (draft, `design/portfolio-experience`, head `748ee9b`), preview <https://design-portfolio-experience.portfolio-site-bs9.pages.dev>. Last updated at Milestone A.

Baseline note: the initial status from the planning discussion was not available to the Frontend agent, so every row below was derived from code, build output and the hosted preview. Corrections welcome.

## A. Visual redesign and website experience

| Item | Agent | Status | Evidence | Remaining acceptance |
|---|---|---|---|---|
| Design tokens, type, light and dark themes | Frontend | Complete | `src/styles/tokens.css`; commit `3b033c5`; preview checked in light and dark | Owner review of hosted dark mode |
| Homepage and collection index | Frontend | Complete | `src/pages/index.astro`; hosted check | None |
| Work page with sticky collection rail | Frontend | Complete | `src/pages/projects/index.astro`; `748ee9b`; local scroll test at 3 viewports | None |
| Header navigation and mobile menu | Frontend | Complete | `Base.astro`; hosted mobile check | None |
| Contact form | Frontend | Partial | Markup and wiring unchanged and rendered on preview | Not test-submitted (would email owner); needs one approved submission |
| Redesign of Ascent, Scientific pages, project walkthrough pages | Frontend | Partial | They inherit tokens; layouts unchanged | Per-page visual pass in Milestones C and D |
| Accessibility and responsive checks | Frontend | Partial | axe clean on Milestone A pages; no horizontal overflow at 360 to 1440 px | Re-run per milestone; keyboard walkthrough of rail and dropdown |

## B. Portfolio organization and integrated application suites

| Item | Agent | Status | Evidence | Remaining acceptance |
|---|---|---|---|---|
| Six collections, seven suites, ten apps, one registry | Frontend | Complete | `src/data/collections.ts`; Work page | Update with each new engine |
| Routes preserved | Frontend | Complete | Build link checker (3076 refs); hosted route checks | Keep in CI |
| Runs-where labels ("browser" vs "hosted demo") | Frontend | Complete | `runsLabel`; cards | Change label as each app goes native |
| Crucible and Tunera names; ModelForge and TuneLedger aliases | Frontend | Complete | `collections.ts` header comment | Renaming needs owner approval |
| Studios as working shared workspaces (Model Engineering, Agent Systems, etc.) | Shared | Not Started | Suites are navigation groupings only | Shared navigation and state per studio once members are native |
| Future engines (circuits, compiler) | Shared | Not Started | Intentionally absent from the site | Build before listing |

## C. Native functional applications and parameter explanations

| Item | Agent | Status | Evidence | Remaining acceptance |
|---|---|---|---|---|
| Decision Intelligence, seven scenarios native | Shared | Not Started | Site still opens hosted demo. Codex branch has a robotics-only contract and a closed (503) route | Milestone B; see backend checkpoint |
| Symbolic and Numerical engines (WebAssembly) | Shared | Partial | Run in browser at `/labs/scientific-systems/` | Milestone C: parameter explanations and unified studio UI |
| Ascent | Frontend | Partial | Native in browser, locally saved progress; two Python-in-browser e2e tests fail identically on `main` | Fix or explain the environmental failures |
| EquityScout | Shared | Partial | Public calculator with invented property; private API fails closed | Parameter guide; owner-data path is Codex |
| Leverline | Frontend | Partial | Standalone site, catalog estimates | Remains separate by design; link only |
| Crucible, Tunera, Recursa, Harness² Lab native | Shared | Not Started | All open hosted demos | Milestone D |
| Every control explains meaning, units, range, default, effect | Frontend | Not Started | Only robotics fields have this in Codex's metadata | Apply per app as it goes native |

## D. Security, inference, and cost governance

| Item | Agent | Status | Evidence | Remaining acceptance |
|---|---|---|---|---|
| No keys exposed in the frontend | Shared | Complete | No inference code or keys on `design/portfolio-experience` | Re-check on each branch |
| Preview cannot invoke paid inference | Shared | Partial | This branch has no inference; EquityScout API returns 503 on preview | Cloudflare Preview env vars not visible to Frontend; Codex or owner to confirm none hold production keys |
| Authenticated first-party inference route | Codex | Not Started | `functions/api/decision-engine/evaluate.js` always returns `NOT_READY` 503 (by design) | Auth, protected compute, verified quota |
| Durable per-user quotas (D1) | Codex | Partial | D1 migration exists for EquityScout only | Quota for inference routes |
| Versioned contracts for all seven scenarios | Codex | Partial | Robotics validators and result schema v1; metadata for all seven | Six scenario contracts, error and state definitions |
| Deterministic nonbillable fixtures | Codex | Partial | Single robotics fixture marked `test-fixture-only` | Fixtures for all seven scenarios |
| Honest unavailable states | Shared | Partial | API returns structured `NOT_READY` | Frontend states in Milestone B |
| CI deploy check | Codex | Partial | CI verify and e2e run on PRs | "Workers Builds: portfolio-website" check fails on this PR; also check main |
