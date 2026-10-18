# Cloudflare Pages production setup

This is the existing Astro portfolio, connected to `https://github.com/jacobhroutzong/portfolio-website.git`. The original GitHub README and history are preserved. Preparation and local commits do not publish the site; wait for explicit approval before pushing or selecting Save and Deploy.

## Build configuration

Create a **Pages** project from the existing GitHub repository, not a new repository or a Workers application. Authorize the Cloudflare integration for this repository only as appropriate.

| Setting | Exact value |
| --- | --- |
| Repository | jacobhroutzong/portfolio-website |
| Framework preset | Astro |
| Production branch | main |
| Root directory | blank (repository root) |
| Build command | npm run build |
| Build output directory | dist |
| NODE_VERSION environment variable | 24 |
| SITE_URL environment variable | https://jacobroutzong.dev |

The tracked `.node-version` selects Node 24; CI uses the same major version. Cloudflare installs npm dependencies before the build. Locally, use `npm ci` followed by `npm run build` to reproduce the locked install and static output. No Cloudflare adapter or API token is required for this static Pages deployment.

Do not set `INCLUDE_DRAFTS`, `CHALLENGE_INDEX_FILE`, or `CHALLENGE_INDEX_URL` in Cloudflare for the current snapshot-based setup. The Hugging Face app remains hosted separately and is loaded only from its project page. Repository activity remains a dated snapshot until a separate refresh schedule is authorized.

## Domain

After the first authorized deployment, add `jacobroutzong.dev` under the Pages project's **Custom domains**. For this apex domain, Cloudflare requires the domain's nameservers to point to Cloudflare. Review existing DNS records before changing nameservers so email and other services remain intact. Follow the Pages domain setup rather than guessing DNS targets. HTTPS must be active for the `.dev` address.

Astro's production origin defaults to `https://jacobroutzong.dev` and can be overridden with `SITE_URL`. The site currently retains its profile readiness guard (`profile.configured: false`): it serves normally but emits noindex, disallows crawling, and keeps the sitemap empty until the profile is approved for indexing. This does not make the deployment private.

Once the domain is active, the app page will be `https://jacobroutzong.dev/projects/decision-intelligence-engine/`. You can then link it from Hugging Face. No DNS records or Hugging Face settings are changed by this repository preparation.

## Publishing gate

Before an approved push, fetch origin again and check that `main` has not changed. Use a normal fast-forward push; never force-push to replace remote history. Once Pages is connected, later pushes to main may automatically deploy. **Save and Deploy** starts a public deployment.

Official references: [Astro on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/), [build image and Node selection](https://developers.cloudflare.com/pages/configuration/build-image/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
