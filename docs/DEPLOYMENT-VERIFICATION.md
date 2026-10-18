# Deployment preparation — October 18, 2026

- Existing remote inspected: `https://github.com/jacobhroutzong/portfolio-website.git`, default branch `main`, original commit `4d8f80c` containing only `README.md`.
- Original README text retained at the start of the expanded local README. Local main continues the existing remote history; no forced replacement or new repository.
- Production default origin: `https://jacobroutzong.dev`; Cloudflare environment should set the same `SITE_URL`.
- Node 24 selected by `.node-version` and GitHub Actions. Verification runtime: Node v24.13.0, npm 11.6.2.
- `npm ci` succeeded after stopping an old Astro development preview that held a Windows native-module file lock.
- `npm run build` succeeded, producing static files in `dist/`; 104 internal link/asset references passed.
- `npm run check`: zero errors, warnings, or hints. `npm test`: five passing tests.
- Candidate source/configuration scan: no matches for common private-key, provider-token, GitHub-token, AWS-key, or hardcoded credential-assignment patterns. Pattern scanning cannot guarantee absence of all secrets.
- Ignore checks confirmed `.env` variants, credential files, dependencies, `dist/`, local preview artifacts, verification output, Python caches, and the separate local AdaptForge source/archive are excluded. Those local files were not deleted.
- npm audit reports five high-severity development-tool advisories in the ESLint Astro parser/glob dependency chain. `npm audit --omit=dev` reports zero vulnerabilities. Dependency upgrades were not included in deployment preparation.
- Existing design, routes, project links, and Hugging Face embed retained. Profile indexing guard remains enabled until launch/profile readiness is approved.
- No push, deployment, DNS change, domain registration, or Hugging Face settings change performed.
