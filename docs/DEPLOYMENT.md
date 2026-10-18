# Deploy to free Cloudflare Pages

For this repository's current deployment, use [Cloudflare production setup](CLOUDFLARE-PRODUCTION.md): the existing GitHub repository is `jacobhroutzong/portfolio-website`, and the production origin is `https://jacobroutzong.dev`. The generic repository-creation steps below are background guidance; do not create another repository.

This project is prepared for deployment but has not been published. Create/connect repositories and deploy only when you decide to do so. A `pages.dev` address is free; a purchased custom domain is optional and separate.

For the step-by-step connection, local tests, and explicit push/publish gates, follow [Connect the two repositories](CONNECT-REPOSITORIES.md). For daily snapshots, set the index URL in GitHub Actions only and leave it unset in Cloudflare so hosting builds use the validated committed snapshot.

## 1. Create separate GitHub repositories

Create `portfolio-website` from this folder and `coding-challenges` from its sibling. Each major app should have its own repository. Use `main` as the default branch. Keep both projects' package-lock files. Do not upload node_modules, .env, or temporary files.

Run `npm run verify` locally in each repository before pushing. The checked-in GitHub Actions workflows repeat checks on main and pull requests; no deployment credentials are needed for CI. If you want quality checks to prevent production updates, require the CI check through branch protection before merges to main.

## 2. Connect the portfolio to Cloudflare Pages

In the Cloudflare dashboard choose Workers & Pages, create a Pages project, and connect to GitHub. Select `portfolio-website` and authorize only the repositories you intend to expose to the integration.

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Production branch | main |
| Root directory | Leave blank when this folder is the repository root |
| Build command | npm run build |
| Build output directory | dist |
| NODE_VERSION environment variable | 24 |
| SITE_URL environment variable | https://YOUR_PROJECT.pages.dev |

No Cloudflare adapter, Workers runtime, database, or secret is required for this static site. Set `SITE_URL` after confirming the chosen Pages project hostname, then rebuild. Set it to the final custom domain if you later add one. Never set INCLUDE_DRAFTS in hosting settings; production excludes drafts regardless.

Cloudflare builds and publishes main-branch updates automatically. Other branches and pull requests can receive preview deployments through the Git integration; configure their access and availability in Pages settings. Until you configure the real profile and SITE_URL, the generated site discourages search indexing. That does not make a deployment private.

Official guide: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/

## 3. Connect coding challenge updates

In the coding repository, set `repository.json`:

```json
{ "repositoryUrl": "https://github.com/YOUR_USERNAME/coding-challenges" }
```

Add genuine solutions and run `npm run index`, then commit index.json along with the source. The URL below requires a public repository:

```text
https://raw.githubusercontent.com/YOUR_USERNAME/coding-challenges/main/index.json
```

You have three options:

1. **Manual local snapshot:** import with CHALLENGE_INDEX_FILE and commit `src/data/challenges.json` in the portfolio. No network dependency in Cloudflare builds.
2. **Build-time import:** set CHALLENGE_INDEX_URL in Cloudflare production/preview build settings. Each portfolio rebuild fetches current metadata. Changes in the coding repository alone do not automatically trigger that rebuild.
3. **Automatic daily sync:** set the CHALLENGE_INDEX_URL repository Actions variable in `portfolio-website` and enable its `Refresh challenge snapshot` workflow. It runs daily at 09:17 UTC or manually, validates the new snapshot and site, and commits a changed snapshot to main. The Cloudflare Git integration rebuilds on that commit. GitHub can delay scheduled runs. If branch protection blocks bot pushes, use the manual snapshot option or adapt the workflow to a reviewed PR. The workflow stays inactive until its variable is set.

No personal access token or deploy-hook secret is embedded. For private coding repositories, use manual snapshots; the public fetch setup does not support private authentication.

## 4. Optional custom domain

After launch, add a domain you already own in the Pages project's Custom domains settings, follow Cloudflare's DNS instructions, update SITE_URL, and rebuild. Do not buy a domain merely to get started.

## Production launch checks

Confirm your profile, draft flags, actual image captions, challenge source paths, repository branch names, social links, résumé, robots.txt, sitemap.xml, and page metadata. Test the deployed site once you explicitly authorize deployment. Projects with server/database requirements need separate hosting; link their demos from project metadata.
