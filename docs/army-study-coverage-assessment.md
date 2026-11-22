# Army Study coverage assessment

Assessment date: 22 November 2026. This records the current curriculum's scope and the division between an initial curriculum build and recurring maintenance. It is not a fresh audit of every publication passage or external URL.

## Current learning coverage

The EW curriculum is a conceptual primer and a traceable source-reading plan. The chapter inventory is useful for navigation and identifying omissions; it does not establish complete instruction in each chapter.

| Publication | Mapped units | Lesson + source reading | Guided source reading | Units without an on-site lesson | Lessons | Questions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| FM 3-12 | 14 | 11 | 3 | 0 | 18 | 54 |
| ATP 3-12.3 | 10 | 7 | 3 | 2 | 10 | 30 |
| ATP 3-12.4 | 5 | 4 | 1 | 1 | 7 | 21 |
| JP 3-85 | 13 | 5 | 8 | 0 | 15 | 45 |
| ATP 6-02.70 | 8 | 6 | 2 | 0 | 11 | 33 |
| ATP 3-01.81 | 8 | 3 | 5 | 1 | 8 | 24 |
| ATP 7-100.1 | 18 | 2 | 16 | 4 | 9 | 27 |
| ATP 7-100.3 | 16 | 3 | 13 | 3 | 9 | 27 |
| **Publication courses** | **92** | **41** | **51** | **11** | **87** | **261** |

Five introductory lessons and 15 questions bring the complete EW catalog to 92 lessons and 276 questions. Of the mapped units, 81 link to some on-site instruction. The other 11 have source locators and reading objectives. Guided-reading units with lesson links teach a conceptual subset.

Counting only `lessons[].sections[].text` in `public/study/ew/data.json` gives 17,454 words, a median of 191 words per lesson, and a range of 100–258 words. This includes reading instructions but excludes objectives, key terms, and questions. Each lesson has exactly three answered questions. The current depth supports short introductions and recall, rather than a claim to comprehensive working knowledge of eight manuals.

Examples of remaining source dependence include FM 3-12 report and message-format details, ATP 3-12.4's tactical-skills appendix, much of JP 3-85's planning material, and the threat manuals' capability appendices. Some material belongs in guided source reading or supervised practical training; the next curriculum milestone must give those choices an explicit rationale instead of treating a chapter link as complete teaching.

Known edition gaps are recorded in `docs/army-study.md`: ATP 3-12.3 Change 2, the cited March 2026 JP 3-85 revision, and the 2025 Ranger Handbook need reconciliation against accessible source text. Zero units currently carry `unverified` status, but that does not erase these course-level edition gaps or the recorded limits on appendix-body access. Soldier Study remains a planned initial curriculum.

## Link confidence

The documented initial inventory covered 31 external URLs: nine reachable or independently retrievable, one extraction size limit, one confirmed 404, and 20 inconclusive access/network results. The confirmed JTS 404 was repaired and available catalog/alternate links exposed beside citations. This improves access but does not establish that every reference works for every learner.

Structural tests validate IDs, mappings, nonempty answer keys, expected unit counts, and regression constraints. Internal-link tests validate site navigation and assets. Neither test class proves doctrinal accuracy, complete objective coverage, or external document reachability.

## Initial build and recurring maintenance

The initial curriculum milestone should establish relevant learning objectives from verified source sections/task IDs, teach the core objectives with explanations and appropriate questions, build the proposed Soldier Study courses, and give each relevant objective an honest disposition: taught, partial, source reading, practical training, excluded with rationale, or blocked pending verification. It should also resolve confirmed wrong/broken links and accessible edition gaps.

Weekly reviews should check all deduplicated reference URLs lightly, reconcile one bounded source section/group in depth, address evidenced corrections, and add small missing objectives. The existing maximum of three lesson corrections/additions per run is a maintenance limit; it is not a substitute for completing the initial curriculum.

Quarterly reviews should check official edition/change/supersession metadata across the full source inventory and identify affected lessons. Both reviews should reuse existing evidence, preserve stable content identities, report access uncertainty, and prepare reviewable changes without unattended deployment. No arbitrary percentage of full-manual knowledge is claimed.
