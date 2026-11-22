# Army Study

## Released scope

The study hub at `/study/` links to PhaseUp 17E, Soldier Study, and EW Study. Army Acronyms is available from the PhaseUp overview.

- `/study/17e/`: the existing PhaseUp study station. Its 117 Phase VI card objects are unchanged. Three general AGSU definition/preparation cards were removed (`extra42`, `extra43`, `phasevi-focus-08`), and the AGSU inspection-requirement policy card is categorized under PL15. All 16 AGSU placement/measurement questions remain. The bank now contains 508 cards.
- `/study/17e/acronyms/`: 36 sourced terms, searchable reference, recall practice and review ratings. The prior `/study/acronyms/` path redirects here. The acronym page belongs to PhaseUp, while retaining its own study progress.
- `/study/ew/`: nine courses, 92 original lessons and 291 answered recall/application questions. Five introductory lessons lead into eight publication courses.
- `/study/soldier/`: four general Soldier courses, 16 lessons, and 39 answered scenario questions.

The additions use static HTML, CSS, JavaScript and JSON in the existing Astro/Cloudflare Pages deployment. They add no service, account, dependency or database. Study pages retain noindex metadata; portfolio navigation is unchanged.

## Reader and study behavior

The EW catalog supports topic search across all lesson text, course selection, ordered previous/next navigation and direct links to individual lessons. Each lesson includes objectives, an explanation, key terms, source locators and questions with hidden answers. Practice can cover a selected lesson, selected course or all lessons; learners can filter to items marked for review.

The coverage map lists chapters and substantive appendices with their topics, source pages, linked lessons and remaining reading objectives. Lesson completion records a learner's study activity. It does not certify mastery or full publication coverage.

## Publication inventory

The inventory follows the table of contents of each verified reading edition. Chapter + appendix counts exclude front matter, glossaries, bibliographies, indexes and other administrative reference aids. Those aids remain available in the cited manuals.

| Publication | Verified reading edition | Chapters + appendices | Lessons | Questions |
| --- | --- | ---: | ---: | ---: |
| FM 3-12 | 17 September 2025 | 5 + 9 | 18 | 56 |
| ATP 3-12.3 | 30 January 2023, Change 1 dated 18 September 2024 | 6 + 4 | 10 | 32 |
| ATP 3-12.4 | 9 January 2023 | 4 + 1 | 7 | 22 |
| JP 3-85 | 22 May 2020 | 4 + 9 | 15 | 47 |
| ATP 6-02.70 | 16 September 2025 | 3 + 5 | 11 | 35 |
| ATP 3-01.81 | 23 May 2025 | 7 + 1 | 8 | 25 |
| ATP 7-100.1 | 29 February 2024, Change 1 dated 23 April 2024 | 7 + 11 | 9 | 30 |
| ATP 7-100.3 | 9 August 2021, Change 1 dated 24 November 2021 | 9 + 7 | 9 | 29 |

The eight courses map 92 substantive units. All 92 now link to conceptual instruction, including the 11 units previously supported only by source reading. The interface keeps 41 lesson-plus-reading and 51 guided-reading badges. The [objective ledger](army-study-coverage-assessment.md) distinguishes 248 taught objectives from additional reading, supervised practical work, exclusions and edition blockers.

### Edition and access limits

- ATP 3-12.3: APD lists Change 2 dated 22 August 2025. The inspected current-record download carried the Change 1 title and transmittal. This course explicitly uses Change 1 dated 18 September 2024. Change 2 text and its coverage are unresolved.
- **JP 3-85.** Two Army articles cite a March 2026 revision, including one that gives 17 March. The cited JDEIS reading path redirected to a logout page. The course uses the verified 22 May 2020 text. Its official PDF and historical third-party mirror had access errors during this pass, while indexed public text corroborated the checked passages. The revision’s contents and text remain unverified.
- **ATP 3-01.81.** The Army Publishing Directorate PDF confirms the 23 May 2025 edition, 106 physical PDF pages, and the printed locations of the checked Appendix A passages.
- **ATP 7-100.1 and ATP 7-100.3.** The Army Publishing Directorate PDFs confirm the existing Change 1 editions, with 280 and 252 physical PDF pages respectively. The passages used for the new appendix connections were checked in the PDFs. Organizational examples represent the dated U.S. Army training models.
- Official publication servers sometimes rejected direct retrieval during review. Catalog records, text excerpts and reading copies are distinguished in the source registry; a catalog link is never described as an inspected full text.

## Bounded content review

Review completed 22 November 2026:

1. Identify the publication and change sheets; inspect actual chapter/appendix inventories and available supporting text.
2. Author original conceptual lessons, learning objectives, source locators and answered questions against that inventory.
3. Reconcile the content with the inventory. Map each unit to lessons or guided reading, and retain specific source/edition limits.
4. Fill concrete gaps. A targeted additional pass supplied an EA concepts lesson and FM 3-12 lessons for effects requests, incident reporting and message formats. These remain guided reading where the source contains further procedures.
5. Validate source IDs, lesson/course/question identities, unit counts, mapping integrity and the learner-facing interface. Review high-risk distinctions such as EA versus EP, evidence versus attribution, doctrine date, and UTC date rollover.

`public/study/ew/data.json` is the curriculum and coverage source of truth. Its `coverageReview` records the per-group review passes, unresolved limitations and primary-source evidence. Stable lesson and question IDs preserve existing ratings when wording changes. The table of contents and checked reading edition determine the scope; the interface never presents chapter mapping as a percentage of manual mastery.

The subsequent EW objective pass reviewed the Army, Joint and spectrum, and C-UAS and threat publication groups. It expanded 13 existing lessons, added 15 application questions, and checked source-backed answers and the scope of additional reading. The objective ledger records the passage and question evidence and the two edition-specific resume points.

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
| Soldier Study | `soldier-study.progress.v1` |
| Existing PhaseUp | `phaseup17e.progress.v1` |

Study pages write progress only after a learner action. Reset requires confirmation and removes only the current area's key. Storage failures leave study usable for the session. Progress stays local to the browser. The five existing EW lesson IDs, their question IDs, and both new-area storage keys remain stable across the expansion and acronym route move.

## Verification and release

Run `npm run verify` and `npm run test:e2e`. Content checks validate the source registry, stable identities, every manual's expected chapter/appendix count, lesson mappings, reading dispositions and preserved AGSU/Phase VI constraints. Browser tests cover search, reveal, course/lesson/all recall scopes, previous/next boundaries, direct links, browser history, coverage links, persistence, legacy progress, reset isolation, retry and blocked storage on desktop and mobile.

The publication manifests list the public files. EW coverage and Soldier Study are prepared for separate owner-approved releases through the existing GitHub and Cloudflare pipeline. Release EW first, then Soldier Study. The account PR is a separate staging decision.

## Correction reports

Study pages offer a **Report a correction** action using the existing portfolio contact form and configured inbox. The report supplies study-page context and prompts for the current information, suggested correction, unit or school, effective date and supporting reference. Reports are submissions for owner review; they do not automatically alter the curriculum. Existing consent, validation, activation-pending and delivery-failure behavior remain in use. A provider-accepted submission is distinct from confirmed inbox delivery.

## Curriculum and account milestones

### Soldier Study

The curriculum at `public/study/soldier/data.json` reuses the study course reader, search, recall cards, and completion controls. Its guest snapshot uses `{ ratings, completed }` with stable lesson and question IDs, under `soldier-study.progress.v1`. The reserved account area is `soldier`.

| Course | Learning objectives |
| --- | --- |
| Soldier Foundations | Apply Army Values, read a task standard, interpret map marginal information, and assess terrain-association evidence. |
| Working With Small Units | Distinguish platoon, squad, and team responsibilities, give a complete handoff, rehearse a supervised event, and follow up an after-action review. |
| Field Health and Sanitation | Report failures in preventive controls, distinguish potable from palatable water, identify food and waste contamination pathways, and recognize changes in heat and cold exposure. |
| Casualty Response Foundations | Distinguish training tiers and phases of care, report urgent observations, document a handoff using MIST and DD Form 1380, and understand continuity of care during transfer. |

The 33 mapped objectives include 19 taught, two partially taught, six practical training, three excluded with reasons, and three blocked pending verification. The three former assigned-reading objectives now have on-site lessons and practice questions. The public Army CAR report dated 10 December 2024 supports task `071-COM-1012` and references `071-COM-1000`. These IDs are attributed to the CAR report. Practical entries require observed performance in authorized training.

**Source and edition review, 22 November 2026**

- [ATP 3-21.8](https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=1028215), 11 January 2024, Change 1 dated 23 June 2025. Inspected the Army-hosted reading copy and chapter 1 role locators.
- [ATP 4-25.12](https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=104111), 30 April 2014, Change 2 dated 8 August 2025. Checked the APD record, combined PDF, change sheet and passages used for field health.
- [ATP 4-02.11](https://www.army.mil/article-amp/291504), 23 March 2026. Confirmed the MEDCoE release, supersession of TC 4-02.1 and the official PDF's relevant locators. The [Field Manual Vault](https://www.trex-arms.com/field-manual-vault) helped locate candidate copies. Its casualty-response PDF is labeled as a third-party reading copy.
- [JTS TCCC Guidelines](https://jts.health.mil/index.cfm/CPGs/cpgs), listed 1 May 2026. Checked the linked text for care phases, communication and documentation, plus the JTS Tier 1 designation and DD Form 1380 instructions. The current Deployed Medicine instructor package and complete evaluation sheets remain unverified.
- [STP 21-1-SMCT](https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=1032188), 20 November 2025, and [TC 3-25.26](https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=103749), 15 November 2013. Checked both APD records. The official text links require Army authentication, so current text and full task and chapter mappings remain blocked. The lessons cite independent public Army material for the concepts they teach.


#### Objective depth and link review, 22 November 2026

- **Foundations:** Added a worked evaluation record, a map-margin and symbol interpretation exercise, and a worked scale conversion. Public CAR report `071-COM-1000` is dated 30 November 2022. It identifies the map exercise’s full standard, including marginal items beyond the on-site lesson. The `071-COM-1012` task report is dated 10 December 2024. Both are cited independently of the 2025 STP.
- **Small units:** Taught how headquarters, the rifle squad and its teams share execution, support and reporting responsibilities. Added a training equipment allocation scenario and an AAR example that distinguishes two causes of the same problem.
- **Field health:** Taught how to match basic pest controls to the exposure pathway and distinguish Soldiers’ precautions from unit controls and specialist work. The pesticide exclusion is retained.
- **Casualty response:** Added a timed recognition and escalation scenario, clarified the distinction between tier and phase, and taught the front and back of DD Form 1380, injury time notation, and how the completed card accompanies the casualty. The official instructions are labeled July 2025, updated 21 July 2025. Full Tier 1 assessment, intervention and movement require the applicable authorized training and supervised evaluation.

All 15 original source records and their catalog or alternate links were checked. The new CAR source was checked as well. Of the **21 distinct registry URLs**, 18 returned the intended resource, and three Army RDL URLs had verified indexed text with inconclusive live access after timeouts. No registry URL was confirmed broken or a wrong document. Three upstream routes checked separately from the registry required authentication.

| Source record | Primary URL | Catalog or alternate |
| --- | --- | --- |
| ATP 3-21.8 | Working. Army-hosted PDF, Change 1 dated 23 June 2025 | Working. APD record |
| ATP 4-25.12 | Working. APD PDF, Change 2 dated 8 August 2025 | Working. APD record |
| ATP 4-02.11 | Working. APD PDF dated 23 March 2026 | Working. Vault PDF with the same cover date and page count. The files differ, and the Vault copy is third-party |
| STP 21-1-SMCT | Working. APD record dated 20 November 2025 | APD PDF leads to Army EAMS-A sign-in |
| TC 3-25.26 | Working. APD record dated 15 November 2013 | APD PDF leads to Army EAMS-A sign-in |
| JTS TCCC Guidelines | Working. JTS index lists 1 May 2026 | Working. Guideline text at the destination linked by JTS |
| JTS role-based TCCC education | Working. JTS tier listing | Working. JTS curriculum page. Its instructor destination requires Deployed Medicine sign-in |
| DD Form 1380 instructions | Working. Three-page JTS PDF, July 2025 update | |
| CAR 071-COM-1012 | Inconclusive. Live requests timed out. Indexed Army task text checked | |
| Army Values | Working. Official Army page | |
| ADP 7-0 | Inconclusive. Live requests timed out. Indexed Army text dated 29 April 2024 checked | |
| TC 7-0 series overview | Working. Army Training Management Directorate article | |
| Army range-control training map | Working. Official Army PDF with Land Navigation Basic Course map | |
| Army land-navigation article | Working. Official Army article on the Basic Leader Course | |
| MEDCoE release | Working. Official Army announcement and APD download reference | |
| CAR 071-COM-1000 | Inconclusive. Live requests timed out. Indexed Army task text dated 30 November 2022 checked | |

The [Vault’s August 2003 STP](https://www.trex-arms.com/field-manual-vault/stp-21-1-smct-2003-08) and [July 2001 FM 3-25.26](https://www.trex-arms.com/field-manual-vault/fm-3-25-26-2001-07) are wrong-edition or wrong-designation candidates for these objectives. Neither was adopted. The signed-out [Deployed Medicine instructor route](https://www.deployedmedicine.com/instructors) presented the Allogy login, so the current Tier 1 package version and evaluation sheets remain unverified.

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
