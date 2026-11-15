# Causarium research console release candidate

This UI-only release adds `/projects/causarium/lab/` and links to it from the existing case study. The dark workspace, teal and violet measurements, and three-view structure follow the interactive prototype in the “Causarium” chat.

The server reads the existing approved evidence v1 file through the same strict schema as the case study. It renders recorded numbers and exact table alternatives into the static page. Client code selects already-rendered records and changes presentation. Its visual color and length scales use the stored values. Recovery is explained without adding ratios to the approved record. With JavaScript disabled, all views and recorded comparisons remain available in reading order.

## Verify and release

1. Run `npm run verify` and the desktop/mobile Playwright suite from the isolated branch. Use the built-site preview and the same Chromium engine as portfolio CI. Check keyboard tab and heatmap navigation, mode switching, both Qwen directions, and the static table alternatives.
2. Confirm the approved evidence bytes match SHA-256 `232561831ace6f8c35b4fc4feda4730a3c69494e5ed6701879d836e361cfbbbd`. The repository, source, and build publication boundaries remain in force. The console introduces no endpoint or storage.
3. Keep the branch local until explicit approval. Before an approved release, refresh GitHub `main`, rerun verification, and record the active production deployment in Cloudflare Pages. Use the portfolio's existing GitHub and Pages workflow.
4. After deployment, verify the lab route, case-study link, production evidence digest, keyboard interactions and static fallbacks. Check that the standalone case study and the homepage and Projects links still resolve.

## Candidate verification

All 26 offline research tests, 18 portfolio tests and 34 desktop/mobile Playwright tests passed. The static build, 1,962 internal link and asset checks, and repository, source and build publication boundary checks passed. Desktop (1440 px), mobile (390 px), keyboard navigation and JavaScript-disabled alternatives were checked. The evidence bytes and validation schema matched the M6 baseline.

## Rollback

The candidate is based on the verified M6 production commit `be921e8ee718865a24f6a88f8395692ff135548c`, Cloudflare deployment `b344a358-884c-40ae-a456-139460a16a31` at preparation. If production moves before release, use the deployment active immediately before the lab release as the rollback target. Restore that deployment in the existing Pages project and revert the lab commit on `main` through the normal history-preserving workflow. Verify the original case study, evidence asset, and project navigation afterward.
