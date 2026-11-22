# Army Study

## Released scope

The study hub at `/study/` groups PhaseUp and Army Acronyms under phase preparation and Army foundations. EW Study is a separate resource for continued professional learning beyond AIT.

- `/study/17e/`: the existing PhaseUp study station. Its 117 Phase VI card objects are unchanged. Three general AGSU definition/preparation cards were removed (`extra42`, `extra43`, `phasevi-focus-08`), and the AGSU inspection-requirement policy card is categorized under PL15. All 16 AGSU placement/measurement questions remain. The bank now contains 508 cards.
- `/study/17e/acronyms/`: 36 sourced terms, searchable reference, recall practice and review ratings. The prior `/study/acronyms/` path redirects here. The acronym page belongs to PhaseUp, while retaining its own study progress.
- `/study/ew/`: nine courses, 92 original lessons and 276 answered recall/application questions. Five introductory lessons lead into eight publication courses.

The additions use static HTML, CSS, JavaScript and JSON in the existing Astro/Cloudflare Pages deployment. They add no service, account, dependency or database. Study pages retain noindex metadata; portfolio navigation is unchanged.

## Reader and study behavior

The EW catalog supports topic search across all lesson text, course selection, ordered previous/next navigation and direct links to individual lessons. Each lesson includes objectives, an explanation, key terms, source locators and questions with hidden answers. Practice can cover a selected lesson, selected course or all lessons; learners can filter to items marked for review.

The coverage map lists chapters and substantive appendices with their topics, source pages, linked lessons and remaining reading objectives. Lesson completion records a learner's study activity. It does not certify mastery or full publication coverage.

## Publication inventory

The inventory follows the table of contents of each verified reading edition. Chapter + appendix counts exclude front matter, glossaries, bibliographies, indexes and other administrative reference aids. Those aids remain available in the cited manuals.

| Publication | Verified reading edition | Chapters + appendices | Lessons | Questions |
| --- | --- | ---: | ---: | ---: |
| FM 3-12 | 17 September 2025 | 5 + 9 | 18 | 54 |
| ATP 3-12.3 | 30 January 2023, Change 1 dated 18 September 2024 | 6 + 4 | 10 | 30 |
| ATP 3-12.4 | 9 January 2023 | 4 + 1 | 7 | 21 |
| JP 3-85 | 22 May 2020 | 4 + 9 | 15 | 45 |
| ATP 6-02.70 | 16 September 2025 | 3 + 5 | 11 | 33 |
| ATP 3-01.81 | 23 May 2025 | 7 + 1 | 8 | 24 |
| ATP 7-100.1 | 29 February 2024, Change 1 dated 23 April 2024 | 7 + 11 | 9 | 27 |
| ATP 7-100.3 | 9 August 2021, Change 1 dated 24 November 2021 | 9 + 7 | 9 | 27 |

The eight courses map 92 substantive units: 41 have lesson-and-source-reading coverage and 51 have guided source reading. Of the 92 units, 81 link to at least one conceptual lesson; the remaining 11 carry specific reading objectives and source locators. This is a broad conceptual curriculum and a traceable reading plan. Full subsection, figure, equipment-operation and procedural coverage is not claimed.

### Edition and access limits

- ATP 3-12.3: APD lists Change 2 dated 22 August 2025. The inspected current-record download carried the Change 1 title and transmittal. This course explicitly uses Change 1 dated 18 September 2024. Change 2 text and its coverage are unresolved.
- JP 3-85: two official Army articles cite a March 2026 revision, including one giving 17 March 2026. Public text and contents for that revision were not verified. This course follows the verified 22 May 2020 text; the source registry retains the Joint Staff URL and provides a checked public reading mirror.
- ATP 3-01.81: the official indexed cover, contents and lesson-supporting text were checked. Its physical PDF page count was not established and remains null.
- ATP 7-100.1 and ATP 7-100.3: the official indexed text verifies the editions, tables of contents and conceptual lesson references. Not every appendix body or subordinate heading was exposed. These remain guided reading where appropriate. The courses describe dated U.S. Army training models and do not claim to represent current force inventories.
- Official publication servers sometimes rejected direct retrieval during review. Catalog records, text excerpts and reading copies are distinguished in the source registry; a catalog link is never described as an inspected full text.

## Bounded content review

Review completed 22 November 2026:

1. Identify the publication and change sheets; inspect actual chapter/appendix inventories and available supporting text.
2. Author original conceptual lessons, learning objectives, source locators and answered questions against that inventory.
3. Reconcile the content with the inventory. Map each unit to lessons or guided reading, and retain specific source/edition limits.
4. Fill concrete gaps. A targeted additional pass supplied an EA concepts lesson and FM 3-12 lessons for effects requests, incident reporting and message formats. These remain guided reading where the source contains further procedures.
5. Validate source IDs, lesson/course/question identities, unit counts, mapping integrity and the learner-facing interface. Review high-risk distinctions such as EA versus EP, evidence versus attribution, doctrine date, and UTC date rollover.

`public/study/ew/data.json` is the curriculum and coverage source of truth. Its `coverageReview` records the per-group review passes, unresolved limitations and primary-source evidence. Stable lesson and question IDs preserve existing ratings when wording changes. The table of contents and checked reading edition determine the scope; the interface never presents chapter mapping as a percentage of manual mastery.

This is a dated content release. On 22 November 2026, the owner requested two external review tasks: a weekly coverage review on Monday mornings in America/New_York, and a publication-edition check every three months starting 22 February 2027. These tasks can prepare bounded draft corrections; they do not merge or deploy unattended. There is no scheduled research process in the site's runtime. Future edits address a named missing topic, verified source change or demonstrated broken link, update the relevant source record, and rerun affected checks.

### Reference access review — 22 November 2026

The initial inventory contains 31 distinct external reference URLs. Nine were reachable directly or verified through independent web retrieval; one current PDF exceeded the research tool's extraction size limit; one URL returned a confirmed 404; and 20 could not be conclusively verified because of network or access failures. A failed automated request is not automatically a dead link.

- The JTS nursing guideline's former URL returned 404. Its [current JTS index](https://jts.health.mil/index.cfm/CPGs/cpgs) points to [the v1.1 PDF](https://jts.health.mil/assets/docs/cpgs/Nursing_Interventions_PCC_08_July_2025_ID70_v1.1.pdf). The replacement was checked for title, 8 July 2025 publication date and the MARCH-PAWS terminology on printed page 6. The source record uses that verified URL, complete title and locator; learner answers are unchanged.
- The [Ranger Handbook catalog](https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=1032023) lists 19 September 2025. Existing acronym citations use the 26 April 2017 reading edition. The older reading URL remains unverified, and the new edition's relevant passages require reconciliation. The reference displays this limitation and a current catalog link rather than silently changing its cited edition.
- Lesson, acronym and coverage citations expose the catalog and alternate reading links already present in their source records. Alternate copies retain their existing edition and provenance labels.

Both review tasks now check reference links. The weekly task performs a lightweight pass over all deduplicated document URLs as well as its bounded content review. The quarterly task checks official catalog and reading links alongside edition metadata. Record the original and final URL, expected publication/edition, check date and access classification. Distinguish public access, redirects, login requirements, confirmed 404/410, wrong documents, temporary server errors and unresolved tool/network restrictions. Verify replacement document identity; do not bypass authentication or count an HTTP 200 login page as a working publication. Report unverified links explicitly.

## Acronym editorial choices

The reference distinguishes wartime and peacetime nine-line MEDEVAC fields, labels the ATP 4-32.2 version of the 5 Cs, and uses METT-TC(I). DART's supplied EW expansions were not verified, so it appears as a context-needed note. SPORTS is identified as legacy terminology and is excluded from recall practice. Medical and equipment entries teach vocabulary, not clinical or equipment procedures.

## Progress

| Area | Browser storage key |
| --- | --- |
| Army Acronyms within PhaseUp | `army-acronyms.progress.v1` |
| EW Study | `ew-study.progress.v1` |
| Existing PhaseUp | `phaseup17e.progress.v1` |

Study pages write progress only after a learner action. Reset requires confirmation and removes only the current area's key. Storage failures leave study usable for the session. Progress stays local to the browser. The five existing EW lesson IDs, their question IDs, and both new-area storage keys remain stable across the expansion and acronym route move.

## Verification and release

Run `npm run verify` and `npm run test:e2e`. Content checks validate the source registry, stable identities, every manual's expected chapter/appendix count, lesson mappings, reading dispositions and preserved AGSU/Phase VI constraints. Browser tests cover search, reveal, course/lesson/all recall scopes, previous/next boundaries, direct links, browser history, coverage links, persistence, legacy progress, reset isolation, retry and blocked storage on desktop and mobile.

Public files are individually listed in the existing publication manifests. The existing GitHub PR and Cloudflare release process deploys the site. Production publication of this change was explicitly approved by the user in the active session.

## Correction reports

Study pages offer a **Report a correction** action using the existing portfolio contact form and configured inbox. The report supplies study-page context and prompts for the current information, suggested correction, unit or school, effective date and supporting reference. Reports are submissions for owner review; they do not automatically alter the curriculum. Existing consent, validation, activation-pending and delivery-failure behavior remain in use. A provider-accepted submission is distinct from confirmed inbox delivery.

## Planned next milestone — not implemented

### Soldier Study

Add `/study/soldier/` beside EW Study using the existing course reader and a separate `soldier-study.progress.v1` key. The proposed initial courses are Soldier Foundations, Working With Small Units, Field Health and Sanitation, and Casualty Response Foundations. Keep the existing acronym route and reference set shared across areas. Map relevant source sections or task IDs to teaching, partial teaching, source reading, practical training, out-of-scope rationale or an explicit verification gap.

The initial source candidates are ATP 3-21.8 (11 January 2024, C1 23 June 2025), ATP 4-25.12 (30 April 2014, C2 8 August 2025) and ATP 4-02.11 (23 March 2026, superseding TC 4-02.1), with current JTS all-service-member training references. STP 21-1-SMCT (20 November 2025) and TC 3-25.26 (15 November 2013) have public catalog verification but their inspected download paths require Army authentication. Current full-text coverage is not established for those two references. Source bodies and precise inventories must be checked before authoring new courses.

### Optional accounts and saved progress

The owner requested Google and Sign in with Apple through Supabase. Reuse verified existing resources after a separate, reviewed authentication plan; no provider configuration, database schema or signup policy has changed in this patch.

- Keep guest study available. Offer an explicit import of existing browser progress into a signed-in account.
- Preserve the separate PhaseUp `records/events/exams` and course `ratings/completed` formats with dedicated adapters. Preserve stable content IDs.
- Scope signed-in caches and pending operations to user ID and study area. Use versioned server updates, idempotent history entries and explicit reset revisions so stale devices cannot silently overwrite or resurrect progress.
- Use ownership-enforced row-level security for any progress tables, a publishable browser key, exact approved callbacks and user-initiated identity linking where provider addresses differ. Keep private credentials outside the browser and repository.
- Shared Supabase Auth settings affect other applications. Confirm existing application authorization and obtain approval before changing shared providers, public signups or production settings. A new project, paid service or credential rotation requires a demonstrated need and approval.
- Verify existing Google OAuth configuration and credentials. Apple provider prerequisites and the selected web flow must be established before presenting Apple login as available; OAuth client-secret expiry requires a maintenance procedure.
- Bundle the client through the existing build. Preserve the public-file boundary; any versioned schema migration requires a narrowly reviewed repository allowance, not removal of the boundary checks.

Acceptance requires two-user isolation, cross-device save/retrieve, safe guest import, offline retry and conflict handling, account switching/sign-out isolation, durable reset behavior, both configured provider flows, and regression checks for existing study progress and exams. Use GPT-6.2 Sol High for this coupled authentication/progress milestone; Medium is sufficient for isolated editorial or link corrections. Release approval follows a working, verified staging result.
