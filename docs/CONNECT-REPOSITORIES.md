# Connect the two repositories

Preparation only: nothing in this guide requires pushing or publishing now. Stop at the marked gates until you explicitly decide to proceed.

## 1. Choose the repositories

Keep `portfolio-website/` and `coding-challenges/` as sibling folders, each with its own Git repository. Both folders already have independent Git roots. Do not initialize a repository in their parent, copy challenge source into the portfolio, or add a submodule. Only generated challenge metadata crosses between them.

On GitHub, create two empty repositories under your account or organization. Suggested names are `portfolio-website` and `coding-challenges`. Leave README, license, and gitignore initialization unchecked because the local projects already contain files. Public challenges are required for the existing automatic fetch; private challenges use local snapshots instead. The portfolio repository may be private while the deployed site is public.

If either GitHub repository already contains work, clone it to a separate checkout and reconcile the starter there. Do not force-push over existing history.

In each local folder, inspect the target before connecting it:

```powershell
git rev-parse --show-toplevel
git remote -v
git status --short
```

Once the actual URLs are known, add the corresponding remote in each folder:

```powershell
# Run inside portfolio-website
git remote add origin https://github.com/OWNER/portfolio-website.git
# Run separately inside coding-challenges
git remote add origin https://github.com/OWNER/coding-challenges.git
```

If `origin` already exists, inspect it first instead of adding or replacing it blindly. `git ls-remote origin` is a read-only authentication/connectivity check; an empty new repository may return no refs successfully. Connecting a remote does not upload files.

## 2. Set the challenge source

In the coding repository, edit `repository.json` to contain its real GitHub URL (without `.git`):

```json
{ "repositoryUrl": "https://github.com/OWNER/coding-challenges" }
```

Use `main` for the solutions branch because the portfolio builds source links with `/blob/main/`. Add actual solutions and their metadata, then run in that folder:

```powershell
npm ci
npm run verify
```

This checks solutions and generates/validates `index.json`. Commit the index together with the solutions when ready. The instructional example remains excluded, so zero real solutions is a valid result.

## 3. Test the local connection

Run in the portfolio folder:

```powershell
$env:CHALLENGE_INDEX_FILE = '../coding-challenges/index.json'
try { npm run sync:challenges } finally { Remove-Item Env:CHALLENGE_INDEX_FILE }
npm run verify
```

The importer validates the index before writing `src/data/challenges.json`. Check its repository URL and counts. The portfolio should receive JSON metadata only; challenge implementations remain in the other repository.

**Push gate:** review both repositories' changes, ignore rules, and intended visibility. Only after explicit instruction should you create local commits as needed and push each repository's `main` branch. No push command is part of this preparation.

## 4. Enable daily updates after the first authorized push

In the portfolio GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and create a repository variable:

```text
Name: CHALLENGE_INDEX_URL
Value: https://raw.githubusercontent.com/OWNER/coding-challenges/main/index.json
```

This URL is public metadata, not a secret. Open it first and check that it returns the generated JSON. Do not use a GitHub `/blob/` page URL.

Open **Actions → Refresh challenge snapshot → Run workflow** after you authorize remote updates. That run can commit and push a changed snapshot, so do not run it before the push gate. Check the import and verification logs and the resulting snapshot commit. A no-change run correctly creates no commit.

The workflow runs daily at 09:17 UTC (5:17 a.m. EDT / 4:17 a.m. EST). It downloads and validates metadata, verifies the portfolio, and pushes only a changed snapshot to `main`. It needs permission for its built-in `GITHUB_TOKEN` to write repository contents; organization policy or branch protection can prevent this. For protected `main`, use local reviewed snapshot updates or adapt the workflow to a PR process; do not disable protection just to make a bot push succeed.

GitHub schedules can be delayed and public repository schedules can be disabled after 60 days without activity. See [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Private challenges: leave the URL variable unset and import locally. Publishing a snapshot reveals its metadata and repository links, so review those before publishing. Authenticated private automatic fetching is not implemented.

## 5. Prepare Cloudflare Pages

After the portfolio exists on GitHub, choose **Workers & Pages → Create application → Pages → Import an existing Git repository**. Select only the portfolio repository. Fill in:

| Setting | Value |
| --- | --- |
| Framework | Astro |
| Production branch | main |
| Root directory | blank |
| Build command | npm run build |
| Output directory | dist |
| NODE_VERSION | 24 |
| SITE_URL | https://YOUR_PROJECT.pages.dev |

For the daily snapshot approach, leave `CHALLENGE_INDEX_URL` unset in Cloudflare. Cloudflare builds the validated committed snapshot; GitHub Actions owns fetching. Do not set `CHALLENGE_INDEX_FILE` or `INCLUDE_DRAFTS` in Cloudflare.

**Publish gate:** stop before **Save and Deploy**. That button publishes the site. Connecting Pages also enables future deployments from Git pushes; after connection, pushing portfolio updates or enabling the refresh workflow can publish changes automatically. Decide when to enable that behavior before launching.

Before launch, configure the real profile, set `profile.configured` to `true`, verify `SITE_URL`, and check source links and assets. `noindex` does not make the site private. After authorized launch, test `/challenges/`, a real solution link when available, and the first changed-snapshot rebuild.

Settings follow the [Cloudflare Astro guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) and [Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/). See [DEPLOYMENT.md](DEPLOYMENT.md) for other import options.
