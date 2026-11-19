# Public publication boundary

Cloudflare Pages uses Node 24, npm run build, and dist/. Publish only from main after quality checks. CI checks the repository before installing dependencies. The build checks the tracked files, source assets and generated output against explicit manifests. It rejects unapproved source and routes, credential signatures and source maps. It pins the research assets by SHA-256. Failure output reports categories and counts. The workflow does not upload dist as a GitHub Actions artifact.

Case studies should use original, sanitized text and reviewed images or diagrams. The public research allowlist covers Harness² Lab, Recursa Studio, the numerical and symbolic engines, and the Scientific Systems Lab documentation, diagrams, synthetic fixtures and validation results. The compiler architecture proposal is public design documentation. Review licenses, provenance and benchmark inputs before updating the allowlists or digests. The separate activity allowlist prevents automatic listing of unrelated repositories and Spaces.

The Recursa Studio case study at `/projects/recursa/` links to the static Application Synthesis replay and the Agent Optimization lab. The existing `/projects/harness2-lab/` route hosts the lab under that case study. The static replay snapshot comes from [Recursa A1](https://github.com/jacobhroutzong/recursa/pull/2) at commit `32734694d92e4429be225bf02e9b43bd33f79bd3`. To refresh it, run `python scripts/export-recursa-studio.py RECURSA_CHECKOUT EMPTY_OUTPUT_DIR` from this repository using a clean, reviewed source checkout. Compare the output with `public/projects/recursa/studio/`, repin changed files in `scripts/public-research-digests.json`, and run `npm run verify`.

Legacy public application addresses have temporary, reversible redirects to case studies. A protected application route must be provisioned and tested independently before traffic is moved. Do not put a private application origin or its credentials into public build variables.

This boundary does not remove earlier versions of this repository, historical provider artifacts, previously published licenses, or browser caches.
