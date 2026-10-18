# Public activity tracker

The main navigation has three destinations: Work (`/projects/`), Links (`/links/`), and About me (the homepage `/`). The homepage begins with a short personal introduction and shows recent GitHub repositories, Hugging Face work, and a selected-project entry point. A separate anchor index scrolls between those sections. Work contains curated project pages rather than an automatic repository catalog; the broader repository list belongs in Activity. Project applications load only on their individual project pages, never on the homepage. `/about/` remains available as a supporting page.

The activity tracker (`/activity/`) is reachable from the homepage and About page and shows public GitHub and Hugging Face metadata. Profile URLs are configured in `src/config/profile.ts`. Coding challenge source remains in its own repository. The default visual design follows the original editorial concept: warm ivory, muted green, Arial body text, and Georgia headings. The original concept comparison remains at `/concepts/`.

Run `npm run sync:activity` to fetch the public GitHub repository list and Hugging Face models, datasets, and Spaces. Then run `npm run verify`. The script writes only `src/data/activity.json`, after all four requests succeed; a failed fetch leaves the previous snapshot intact. No token or private account access is used. GitHub's list currently supports up to 100 repositories.

The Activity page labels forks, shows push/update dates, and displays when the snapshot was checked. Dates describe repository updates, not verified personal contributions. Hub listings with no update date are explicitly labeled. No public models or datasets is a valid empty result.

This first version uses a committed snapshot and does not poll automatically. Once hosting is selected, we can configure scheduled refreshes and deployments under your explicit publishing authorization. Until then, updating local data never pushes or publishes anything. App links launch external hosts in a new tab; embedding or moving an app into the portfolio requires checking that app's hosting requirements.
