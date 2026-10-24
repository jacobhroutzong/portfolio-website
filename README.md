# portfolio-website
# hosts my portfolio website

## Ascent learning app

The integrated app lives at `/ascent/`. See [Ascent setup, deployment, authoring, and limits](docs/ASCENT.md). It shares this portfolio's static Cloudflare Pages deployment; no separate service is required.

## Engineering portfolio

A static Astro + TypeScript + Tailwind portfolio designed for Cloudflare Pages. Open this folder as a project in Codex to work on the site.

Repository: https://github.com/jacobhroutzong/portfolio-website
Production origin: https://jacobroutzong.dev
Deployment settings: [Cloudflare production setup](docs/CLOUDFLARE-PRODUCTION.md).

## Local setup

Requires Node.js 24 LTS (minimum 22.12).

```sh
npm ci
npm run dev
```

Open the printed Local URL. `npm run dev` first optimizes raster images. Restart after changing `.env`.

```sh
npm run verify      # ESLint, Astro types, tests, import, image generation, build, links
npm run build       # Production files in dist/
npm run preview     # Serve the production build locally
```

PowerShell users can run these commands unchanged. For local draft previews, add `INCLUDE_DRAFTS=true` to `.env`; it only takes effect in the development server. All drafts remain excluded from production builds.

## Configuration

Edit `src/config/profile.ts` for your name, initials, introduction, skills, experience, education, résumé, email, and social links. Empty social URLs are not displayed. Enter full HTTPS URLs for social links and repositories. Add a real résumé to `public/resume.pdf` before setting its link. The source code does not include a fake résumé.

Set `SITE_URL` to the final HTTPS site origin in Cloudflare. Before launch, replace placeholders and set `profile.configured` to `true`. Until both the profile and site URL are configured, the site declares `noindex`, robots.txt disallows crawling, and the sitemap is empty. These are indexing signals, not access controls.

See [content authoring](docs/CONTENT.md) and [Cloudflare deployment](docs/DEPLOYMENT.md).

## Challenge import

The initial committed snapshot is empty. The instructional sample in the coding repository is excluded.

To import a sibling coding repository's generated index in PowerShell:

```powershell
$env:CHALLENGE_INDEX_FILE = '../coding-challenges/index.json'
npm run sync:challenges
Remove-Item Env:CHALLENGE_INDEX_FILE
```

Alternatively configure `CHALLENGE_INDEX_URL` with your public raw GitHub index URL. Every build downloads and validates it; failed downloads or validation fail the build rather than silently substituting invented data. Without either variable, builds validate the committed snapshot and need no coding repository or network access.

Source/explanation links use the `repositoryUrl` in the imported index, not a separately configured display link. The contract assumes a `main` branch. Keep solutions on that branch or adjust `repositoryFileUrl` if choosing another branch.

## Maintenance

- Add projects through Markdown and media, not component changes.
- Add solutions in the coding repository and generate its index; never hand-edit dashboard counts.
- Add new language test commands to the coding repository's CI when adding those languages.
- Run `npm run verify` before pushing. `package-lock.json` pins the installed dependency graph.
- The site uses local system fonts, local icons, and no analytics or paid services.
- Normal published pages do not include examples or draft claims. The public media folder is always copied during build; keep private images outside the repository.
- For social previews, replace `public/og.svg` with a real 1200×630 PNG or JPEG and update the image path and card type in `Base.astro`. SVG support varies across social platforms.
