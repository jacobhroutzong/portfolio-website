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

The exact migration may be versioned in this repository but is forbidden in `public/` and built output. All other existing private-path and credential rules remain. The migration does not alter shared Auth settings or existing application tables.

The transactional probe in `scripts/verify-study-progress-rls.mjs` passed against staging. It verified owned writes, two-user isolation, anonymous denial, ownership reassignment denial, stale-save rejection, revision enforcement, reset retention and client-delete denial. It rolled back its two synthetic users and progress rows. Subsequent inspection found no remaining probe users. The security-advisor result had no new Army Study finding.

## Provider prerequisites and remaining acceptance

The staging public Auth settings were read on 22 November 2026: Google enabled, Apple disabled, anonymous users disabled and public signups disabled. Those settings remain unchanged.

The exact study callback is `/study/account/` on the approved staging preview origin. It must be added to the existing Supabase redirect allowlist without replacing the shared site URL, removing other callbacks or enabling public signup. Provider buttons remain disabled until their configuration is verified. Apple developer resources have not been established; no membership purchase or credential creation is authorized by this milestone.

Node tests and mocked browser tests are distinct from live provider acceptance. The browser suite intercepts all Supabase HTTP and uses synthetic session fixtures; it does not prove Google consent, Apple consent or provider callback configuration. Real provider flows, hosted cross-device sign-in and the required Apple setup remain acceptance gates. Production Auth and production data have not been changed.

## Verification commands

Run the existing `npm run verify` and normal browser suite for guest regression coverage. The CI account step then builds only the account bundle with `STUDY_ACCOUNTS_STAGING=1` and runs `tests/e2e/study-accounts.spec.ts`. All service calls in those browser tests are intercepted. The deployed Cloudflare build uses its own branch gate; the CI opt-in cannot enable a production deployment.

For local development, the existing predev hook creates an ignored `public/study/account.js`. For deployment, the bundle is generated into `dist/study/account.js` after Astro builds. SDK version is pinned in the package and lockfile.

## Stop conditions

Do not enable public signup, change production configuration, rotate credentials, provision another service or purchase Apple membership to work around a missing prerequisite. Preserve the tested staging implementation and report the specific remaining access/configuration requirement.
