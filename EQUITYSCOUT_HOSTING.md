# Private portfolio hosting

This is the Cloudflare Pages Functions/D1 implementation for the existing
`jacobhroutzong/portfolio-website` Astro repository. It runs at `/equityscout/`
with private APIs at `/api/equityscout/*`. The public synthetic calculator stays
at `/apps/equityscout/`. Production activation is pending account configuration.

The Python workstation remains runnable. This slice ports the financial engine
using Decimal.js, with 67 golden cases and 15 stress scenarios checked against
Python. It adds signed Cloudflare Access identity verification, owner-scoped D1
SQL, immutable audit snapshots, optimistic edit revisions, saved views, versioned
manual PHA schedules, and batched CSV imports/streamed exports. Paid discovery
and estimate integrations are explicitly disabled. No actual property records,
local passwords, API credentials or `data/` contents are copied into the site.

## Reproduce

Run `python cloud/tools/sync_portfolio.py <absolute-portfolio-checkout>` from this
repository, then in that checkout run `npm ci` and `npm run verify` using Node 24.
The existing Ascent validation also needs Python and NumPy (`ASCENT_PYTHON` can
select that runtime). Tests execute the actual migration using SQLite and use
locally signed RSA sessions to exercise the HTTP service. The production route
does not expose a test authentication switch.

Local D1 migration and Pages emulator, from the portfolio checkout:

```powershell
npx wrangler d1 execute equityscout-local --local --config wrangler.scout-local.jsonc --file migrations/equityscout/0001_owner_records.sql
npx wrangler pages dev dist --d1 SCOUT_DB --compatibility-date 2026-10-25 --port 4333
```

The migration command separately validates the schema in a local database.
The Pages command verifies the unconfigured lock screen; it does not initialize
an authenticated data session. Pages dev does not support custom config paths.
The tracked local config uses a placeholder database ID. Never use it with
`--remote`. Missing identity configuration deliberately returns 503 and loads
no property data. Signed-owner functionality is exercised in the HTTP tests;
real Access login, production persistence, and phone access need live setup.

## Activate in the existing Cloudflare account

1. Sign in to the account that owns Pages project **portfolio-site**. The separate
   Workers Builds project `portfolio-website` is not the production Pages site.
   Keep the current Astro build command and `dist` output directory.
2. Create a D1 database named `equityscout-private`. Record its actual ID. Apply
   `migrations/equityscout/0001_owner_records.sql` to that database once, through
   the dashboard console or authenticated Wrangler. Do not import local data
   automatically. Bind that database to Pages as **SCOUT_DB** for Production.
3. Create a Cloudflare Access self-hosted application protecting
   `jacobroutzong.dev/equityscout` and its descendants. Include
   `jacobroutzong.dev/api/equityscout` and descendants in that same application's
   domains/paths so both use the same application audience. Allow only the
   owner's verified email; use the identity provider's MFA where available.
4. In Pages Production environment variables set:

   | Variable | Value |
   |---|---|
   | SCOUT_ACCESS_ISSUER | `https://<your-team>.cloudflareaccess.com` |
   | SCOUT_ACCESS_AUD | Application AUD tag from that Access application |
   | SCOUT_OWNER_EMAIL | `jacobroutzong@gmail.com` |
   | SCOUT_ORIGIN | `https://jacobroutzong.dev` |

   Do not configure the real D1 binding or owner environment for public PR
   previews. Preview APIs should remain unconfigured and closed.
5. Deploy the reviewed branch through the existing Git/Pages pipeline after
   configuration. No root Wrangler deployment config is supplied, so existing
   Pages dashboard settings remain authoritative. Functions routing includes
   only `/api/equityscout/*`; public portfolio pages stay static.
6. Verify: anonymous private access prompts for sign-in; forged/other-user JWTs
   fail; the owner can create, refresh, edit, export and archive a synthetic
   record; stale edits return 409; restart/new device retains it. Check the
   custom domain and any `pages.dev` endpoint cannot return data anonymously.
   Confirm homepage, Ascent, calculator and email form still work. Remove the
   synthetic record through archive after verification.

## Practical bounds and remaining work

This is an owner-only pilot, capped at 1,000 active properties, 500 rows/upload,
500 KB CSV and 512 KB request bodies. Imports use five records/request; analysis
uses ten records/page. Concurrent writes can change pagination order; refresh
before exports if other devices are editing. Exports include private data and
should be stored accordingly. D1 access isolation is enforced in the service's
prepared SQL, not database RLS. Audit logs are append-only under the application
schema, not protection against a database administrator.

Review the account's actual Workers/D1 request, CPU, query and storage limits
before activation. No paid plan or unlimited capacity is assumed. Monitoring,
backup/restore drills, licensed ingestion and real lender/PHA evidence remain
unfinished; this does not complete every master-prompt requirement.

Cloudflare references: [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/),
[Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/),
[D1 limits](https://developers.cloudflare.com/d1/platform/limits/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/).
