# Repository collection and automatic refresh

The homepage shows About, My work, a combined Repositories section, and Contact. The previous standalone Hugging Face section is merged into Repositories. Coding Challenges stays pinned as the featured repository.

`src/lib/repositories.mjs` groups GitHub and Hugging Face entries with the same case-insensitive repository name. A matching project has one card with links to both services. Different names and Hub-only models, datasets, or Spaces stay separate; forks are labeled. GitHub push dates determine the order of GitHub-backed cards; Hub-only entries use their Hub update date. Activity uses the same grouping and its platform filters include cards with links to both services.

## Automatic metadata updates

`.github/workflows/refresh-activity.yml` runs every six hours at minute 23 UTC, or manually from Actions. It fetches public metadata from both providers, runs grouping tests and the production build when data changes, and commits only `src/data/activity.json` to `main`. Cloudflare Pages' existing Git integration then rebuilds from that commit. No Cloudflare token, deploy hook, or Hugging Face token is required. GitHub's built-in Actions token supplies repository write permission and authenticated GitHub API requests.

The schedule becomes active only after the workflow is pushed to the default branch. GitHub may delay schedules, and can disable them after 60 days of inactivity in a public repository. Repository or organization rules must allow Actions contents writes; protected-branch restrictions may block the snapshot commit. Do not bypass branch protection to fix this; use a reviewed update path if needed.

Run `npm run sync:activity` locally to refresh immediately. The script writes after all requests and metadata validation succeed; failures leave the previous snapshot intact. Unchanged metadata leaves the snapshot and its checked date unchanged, avoiding unnecessary commits. It ignores its own snapshot-only commits when dating the portfolio repository to prevent self-generated update churn. GitHub pagination supports up to 1,000 public repositories; reaching the cap fails safely. Hub requests support up to 1,000 entries per repository type.

Only unauthenticated public Hub metadata is used. Private repositories are not published. Provider tokens stay in CLI stores or Actions secrets; they are never written to the snapshot. The script optionally uses `GITHUB_TOKEN` in memory for GitHub API authentication and sends it only to api.github.com.

`src/data/selected-projects.ts` remains the shared oldest-first curated project registry. Append newly added projects to its end. The homepage and Work page reverse it; the homepage initially shows three with an expand arrow. Curated projects stay independent of repository push activity.

Official references: [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Hugging Face Hub API](https://huggingface.co/docs/hub/en/api).
