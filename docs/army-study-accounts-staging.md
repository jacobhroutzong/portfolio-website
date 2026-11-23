# Army Study accounts — staging

## Scope and release state

The owner approved a staging-only account milestone on 22 November 2026. The link and correction-report release is already on production through PR #34 (`a1171f6`). This account branch does not authorize a production account release.

The implementation supports optional Google/Apple OAuth and per-user progress across PhaseUp, Acronyms, EW and Soldier Study. It uses the existing Supabase staging project and the existing Astro/Cloudflare Pages pipeline. It adds no project, Worker, paid service or OAuth client.

Production and unrelated preview builds default to the guest-only module. Staging uses the existing approved branch or the local test opt-in. A separately approved Cloudflare production opt-in can enable the pilot. The browser also checks its exact allowed origin and staging project. Public configuration contains only a publishable key; no service or provider secret is used by the client.

## Progress behavior

- Guest study keeps the established browser keys and is not automatically imported.
- Signed-in progress uses a separate cache for each user and area. Import requires an explicit learner action and preserves the guest copy.
- PhaseUp retains records, events and exams; the course areas retain ratings and completion. Repeated imports deduplicate history rather than summing the same counters twice.
- Saves compare the expected server revision. Conflicts require a choice between the account version and the device version; no stale device silently replaces a newer save.
- Reset keeps a revisioned empty row, so an old device cannot silently resurrect cleared data.
- Offline changes can be retried. Account switches invalidate late responses and abort pending network requests. Sign-out restores guest progress.
- A local-storage warning is shown separately from cloud status. If sign-out cannot reach the service, the interface distinguishes local sign-out from confirmed server revocation.

## Database boundary

`supabase/migrations/20261122184222_army_study_progress.sql` is an additive migration applied to staging only. It creates `public.army_study_progress`, keyed by `(user_id, area)`, with owner-scoped SELECT/INSERT/UPDATE policies and a revision guard. Anonymous access is revoked. Clients cannot change ownership or area, skip revisions, or delete the row used to preserve a reset revision. The table limits payload shape and size.

The follow-up migration adds `army_study_api.army_study_progress` as an updatable security-invoker view. It exposes only the five columns the progress transport uses. The authenticated role receives view reads and inserts and may update only revision, payload and reset. The existing base table, RLS, revision guard and foreign key enforce the same rules through the view. Both reviewed migrations are versioned in this repository and excluded from `public/` and built output.

For staging, set the Data API exposed schema to `army_study_api` and clear the extra search path. Apply those two settings in a single PostgREST configuration update. The dedicated schema contains only the progress view. The shared Auth configuration and unrelated database objects require no changes. The browser transport explicitly selects this schema on its existing Supabase client.

To roll back, first restore the disabled API configuration (`db_schema` empty, `db_extra_search_path` set to `public, extensions`). Verify the effective disabled state, then revert the branch transport. A compensating migration can drop the view and dedicated schema with `RESTRICT`. All progress rows stay in the base table.

The original transactional probe in `scripts/verify-study-progress-rls.mjs` passed against the staging base table. The probe now exercises the API view before exposure. It verified owned writes, two-user isolation, anonymous denial, ownership reassignment denial, stale-save rejection, revision enforcement, reset retention and client-delete denial. It rolled back its two synthetic users and progress rows. Subsequent inspection found no remaining probe users. The security-advisor result had no new Army Study finding.

## Provider prerequisites and remaining acceptance

The Cloudflare branch preview uses `https://feature-study-accounts-stagi.portfolio-site-bs9.pages.dev`. Use that branch URL for account testing. The only hosted study origin enabled is this branch alias. Its exact Supabase redirect allowlist entry is `https://feature-study-accounts-stagi.portfolio-site-bs9.pages.dev/study/account/`.

Google uses the existing Marqyra staging OAuth web client. Google returns to `https://grpwacfkhwwifnjantdn.supabase.co/auth/v1/callback`; Supabase then returns to the study callback. The shared site URL, existing Marqyra callback, Google audience, and signup restrictions were preserved. Google is enabled in the staging study UI. Apple and public signups remain disabled in Supabase.

The Google project is in testing mode, and the staging Supabase project has one existing Google-linked user. Use an existing authorized user for live sign-in and cross-device testing. Full account-switch acceptance requires two existing staging users with eligible Google identities.

The browser suite intercepts all Supabase HTTP and uses synthetic session fixtures. Live Google sign-in, session restoration and sign-out passed on the staging preview. Hosted sync acceptance uses an eligible Google browser session and disposable study progress. Apple remains gated on verification of an existing Apple Developer team, a primary App ID with Sign in with Apple, a matching Services ID, and usable signing configuration. The Apple Developer resource inventory is behind sign-in, and staging Supabase has no Apple client ID or secret configured.

## Apple web OAuth

Verify the active team in Apple Developer. Use an existing primary App ID with Sign in with Apple, its compatible web Services ID, and a signing key associated with that primary App ID. Confirm the Services ID is authorized for this site and that the corresponding `.p8` is available in the owner's credential store. Request owner approval for any missing identifier or key before creating it. Preserve other apps' existing associations and callbacks. [Apple web configuration](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web)

The Apple Services ID must list `grpwacfkhwwifnjantdn.supabase.co` and the exact staging return URL `https://grpwacfkhwwifnjantdn.supabase.co/auth/v1/callback`. Supabase sends the browser back to the existing study callback on the Cloudflare branch alias. Set the Services ID as the web client ID in the staging Supabase Apple provider. Enable the study button on staging after the provider passes live verification. Production preparation uses `https://kgbdfvyhgycnxyqatali.supabase.co/auth/v1/callback` and requires separate approval before changing the Apple Services ID, the production Supabase provider, or the production build. Keep guest mode and the existing Google pilot gates in place. [Supabase Apple OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)

Keep the `.p8` in the owner's secure credential store. Generate the OAuth client-secret JWT with that key and store the generated secret in the appropriate Supabase Apple provider configuration. Record the exact UTC expiration and renewal owner once issued. The JWT expires within six months. Before expiration, generate a replacement with the same signing key, update the proper Supabase environment, and verify Apple sign-in again. Keep the key and JWT out of the repository, browser bundle, chat, and logs. [Supabase Apple OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)

In staging, verify the Apple callback, restored session, sign-out, and access to a disposable synced progress record. Check that a matching verified identity resolves to the existing Supabase user ID. Test that an unmatched Hide My Email identity cannot access that user's progress. With public signup disabled, an unmatched identity without an existing account should be denied. For explicit linking with a different email, start from the authenticated existing study account and verify the user ID and progress stay the same. Supabase's manual-linking switch applies project-wide. Review its effect on other staging applications before changing it. Verify Google sign-in and browser-local guest saving after the provider change. [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)

## Verification commands

Run the existing `npm run verify` and normal browser suite for guest regression coverage. The CI account step then builds only the account bundle with `STUDY_ACCOUNTS_STAGING=1` and runs `tests/e2e/study-accounts.spec.ts`. All service calls in those browser tests are intercepted. The deployed Cloudflare build uses its own branch gate; the CI opt-in cannot enable a production deployment.

For local development, the existing predev hook creates an ignored `public/study/account.js`. For deployment, the bundle is generated into `dist/study/account.js` after Astro builds. SDK version is pinned in the package and lockfile.

## Production pilot preparation

Production guest study includes the four curricula and the footer credits. This branch preserves those routes and their browser storage formats. The production account bundle defaults to guest-only. The test opt-in for staging is independent of the production flag.

- Review and approve existing pilot identities, the browser session and pending-cache posture, and disposable test progress. No accounts are enrolled by the migration.
- Separately apply `supabase/production-migrations/20261122224309_army_study_production_pilot.sql` to `portfolio-production` only after approval. The checked-in staging migrations stay in their existing directory and must not be pushed to production. The production SQL creates the private tables and one invoker view in a single transaction. It does not configure exposure.
- Record the existing exposed schema list and extra search path in the authenticated dashboard. Verify the view, grants, owner and membership checks before appending only `army_study_api`. Preserve `public`, the extra search path and all unrelated settings. Keep `army_study_private` unexposed.
- Confirm that the existing Google client has registered `https://kgbdfvyhgycnxyqatali.supabase.co/auth/v1/callback`. Read back production Auth redirects and add only `https://jacobroutzong.dev/study/account/` if missing and approved. Preserve the current Site URL, provider, audience, other redirects, disabled signups and disabled Apple.
- Enable `STUDY_ACCOUNTS_PRODUCTION_PILOT=1` plus the verified existing `STUDY_ACCOUNTS_PRODUCTION_PUBLISHABLE_KEY` only in the Cloudflare production environment after approval. The build requires the Cloudflare `main` branch and the browser requires the exact site origin. The build and browser only enable Google for production. Do not put the key in a commit or copy the staging value.
- Roll back by removing the production opt-in and redeploying the guest-only bundle. If access must stop immediately, revoke membership or remove only `army_study_api` from API exposure. Remove the Army Study Auth redirect only if it was added by this rollout and needs removal. Preserve the private progress rows, reset revisions, Auth users and unrelated settings.

The hosted staging checks require two isolated browser contexts, each independently signed in with the same authorized Google identity. Use an area with disposable progress. Establish A’s guest baseline, explicitly import and save, and verify clean B retrieval and reload. Save conflicting changes from the same revision, resolve explicitly, reset and verify the stale device cannot restore the old snapshot. Confirm A’s sign-out restores guest progress while B’s separate session remains usable. Live switching between identities is a separate check.

Retain the prior evidence for Google sign-in, session restoration and sign-out, and the staged database isolation probe. Only mark the hosted sync sequence verified when both real contexts complete it.

## Stop conditions

Do not enable public signup, change production configuration, rotate credentials, provision another service or purchase Apple membership to work around a missing prerequisite. Preserve the tested staging implementation and report the specific remaining access/configuration requirement.
