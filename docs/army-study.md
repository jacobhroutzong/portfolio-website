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

This is a dated content release. It does not run an automatic research or publication-monitoring process. Future edits should address a named missing topic or verified source change, update the relevant map and source record, and rerun the affected checks.

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
