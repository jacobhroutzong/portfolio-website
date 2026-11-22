# Army Study accounts — staging

## Scope and release state

The owner approved a staging-only account milestone on 22 November 2026. The link and correction-report release is already on production through PR #34 (`a1171f6`). This account branch does not authorize a production account release.

The implementation supports optional Google/Apple OAuth and per-user progress across PhaseUp, Acronyms, EW and the future Soldier Study area. It uses the existing Supabase staging project and the existing Astro/Cloudflare Pages pipeline. It adds no project, Worker, paid service or OAuth client.

Production and unrelated preview builds emit a small guest-only module. The account implementation is bundled only for the explicitly approved staging branch or a local test opt-in. The browser also checks its exact allowed origin and staging project. Public configuration contains only a publishable key; no service or provider secret is used by the client.

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

## Verification commands

Run the existing `npm run verify` and normal browser suite for guest regression coverage. The CI account step then builds only the account bundle with `STUDY_ACCOUNTS_STAGING=1` and runs `tests/e2e/study-accounts.spec.ts`. All service calls in those browser tests are intercepted. The deployed Cloudflare build uses its own branch gate; the CI opt-in cannot enable a production deployment.

For local development, the existing predev hook creates an ignored `public/study/account.js`. For deployment, the bundle is generated into `dist/study/account.js` after Astro builds. SDK version is pinned in the package and lockfile.

## Stop conditions

Do not enable public signup, change production configuration, rotate credentials, provision another service or purchase Apple membership to work around a missing prerequisite. Preserve the tested staging implementation and report the specific remaining access/configuration requirement.
