# Army Study sections

The general study hub at `/study/` links to Army Acronyms, EW Study and the existing PhaseUp 17E page. Army Acronyms and EW Study are career-study resources; their data and progress are independent from the AIT phase-up decks.

## Scope

- `/study/acronyms/`: 36 sourced terms, searchable reference, recall cards and user-rated review.
- `/study/ew/`: five introductory lessons, 15 recall questions, lesson completion and ten official publication or reading references.
- `/study/17e/`: navigation links added; its card bank, phase filtering and progress behavior are unchanged.

The additions use static HTML, CSS, JavaScript and JSON in the existing Astro/Cloudflare Pages deployment. They introduce no service, account, dependency or database. They retain the study area's noindex metadata and do not change portfolio navigation or search indexing.

## Content maintenance

The two `data.json` files hold content and source registries. Entries and lessons refer to sources by stable IDs. Sources include edition dates and locators where verified. EW question IDs remain stable when wording changes so saved ratings remain associated with the question.

The initial source review was completed on 22 November 2026. This is a dated reference, not an automatic publication-monitoring service. A catalog link is labeled as a catalog; it does not claim that a direct PDF was retrieved. The ATP 3-12.3 reading copy used for glossary terms includes Change 1; the publication catalogue points to APD's record, which also lists Change 2 dated 22 August 2025.

The glossary distinguishes the wartime and peacetime nine-line MEDEVAC fields, labels the ATP 4-32.2 version of the 5 Cs, and uses METT-TC(I). DART's supplied EW expansions were not verified, so it appears only as a context-needed note. SPORTS is noted as legacy terminology and does not enter recall practice. Medical and equipment terms are vocabulary study; the pages do not provide a clinical procedure course or replace current supervised training.

## Progress

| Area | Browser storage key |
| --- | --- |
| Army Acronyms | `army-acronyms.progress.v1` |
| EW Study | `ew-study.progress.v1` |
| Existing PhaseUp | `phaseup17e.progress.v1` (untouched) |

New pages write progress only after a user action. Reset requires confirmation and removes only the current area's key. Storage failures leave study usable with session-only progress. Progress is local to this browser; no account synchronization is provided.

## Verification and release

Run `npm run verify` and `npm run test:e2e`. The study tests cover source references and stable identities, answer reveal, review filtering, persistence, progress isolation, publication rendering, retry and blocked storage on desktop and mobile.

The added public files are listed individually in the existing publication manifests. Use the repository's existing PR and Cloudflare release process. Production publication requires approval under `docs/CLOUDFLARE-PRODUCTION.md`.
