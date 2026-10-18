# Content authoring

## Profile

Edit `src/config/profile.ts`. Confirm the suggested skills, use real professional background, and only add links you own. Blank URLs and contact details stay hidden. After personalizing, set `configured: true` and supply a real `SITE_URL` for indexing.

## Projects

The six existing files are **project candidates**, not completed work. Drafts are absent from public navigation, featured sections, gallery, sitemap, and production routes. To inspect them locally, add `INCLUDE_DRAFTS=true` to `.env` and restart `npm run dev`.

Add a Markdown file to `src/content/projects/`. Its filename becomes the route slug. Example:

```yaml
---
title: My actual project
summary: A concise, factual explanation of what I built.
category: AI / Machine Learning
technologies: [Python, PyTorch]
draft: true
featured: false
status: In progress
order: 10
screenshots: []
videos: []
---
```

Category must match one of the six categories in the existing entries. Status is `Planning`, `In progress`, or `Completed`. Set `draft: false` only after reviewing the actual content. `featured: true` is valid only when `draft: false` and `status: Completed`.

Optional fields:

```yaml
sourceUrl: https://github.com/YOUR_USERNAME/YOUR_PROJECT
demoUrl: https://YOUR_DEMO_HOST
screenshots:
  - src: /media/my-project/dashboard.png
    alt: Descriptive account of the visible interface
    caption: What this actual screenshot demonstrates
    example: false
videos:
  - url: https://www.youtube.com/watch?v=YOUR_VIDEO_ID
    title: Walkthrough of the implemented system
```

Add the image to `public/media/my-project/dashboard.png`. Use simple letters, numbers, hyphens, underscores, and directories in paths. PNG, JPEG, WebP, AVIF, and SVG are supported. Local raster images are automatically converted to responsive WebP sizes during dev startup and build. Rerun `npm run images` after changing images during a running dev session. Width/height reserve layout space; lazy loading avoids downloading off-screen images immediately.

The gallery derives all entries from visible project screenshots. No separate gallery file is needed. It supports category filters, modal viewing, captions, and a project link. The AeroOps draft includes an explicitly illustrative architecture diagram to demonstrate authoring; it is not an app screenshot or an implemented architecture claim.

Project documents support overview, problem statement, architecture, methods, tradeoffs, evaluation, actual quantitative results, lessons, and future work. Videos are accessible external links rather than tracking-heavy automatic embeds. Add custom interactive demos through `demoUrl`. This site does not host backend services.

Do not invent result metrics. For course projects, publish only material you may share. Signal/security work must remain independently developed and publicly releasable.

## Challenges

See the independent coding repository README. Configure its `repository.json`, add original solutions and metadata, test, then run `npm run index`. Commit the generated `index.json`. The website imports the index through a local file, a configured raw HTTPS URL, or the optional scheduled workflow. Examples remain excluded from counts.

## Publication checklist

- Replace name, initials, intro, skill suggestions, bio, education, and experience.
- Configure real GitHub, LinkedIn, YouTube, X, email, and résumé links as appropriate.
- Set final SITE_URL and profile.configured; replace the SVG social image with a PNG/JPEG for broader compatibility.
- Review each project before switching off draft status; include actual code and real media.
- Configure the coding repository URL before publishing real solutions.
- Run `npm run verify` and inspect `npm run preview` on phone and desktop sizes.
- Review the public media folder and source repository for private material.
