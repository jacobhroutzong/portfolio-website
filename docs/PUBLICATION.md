# Public publication boundary

Cloudflare Pages uses Node 24, npm run build, and dist/. Publish only from main after quality checks. The build checks the source asset manifest before Astro and checks the final output before it can be deployed. The workflow does not upload dist as a GitHub Actions artifact.

Case studies should use original, sanitized text and reviewed images or diagrams. Approved research assets may be added to the explicit public asset manifest. The separate activity allowlist prevents automatic listing of unrelated repositories and Spaces.

Legacy public application addresses have temporary, reversible redirects to case studies. A protected application route must be provisioned and tested independently before traffic is moved. Do not put a private application origin or its credentials into public build variables.

This boundary does not remove earlier versions of this repository, historical provider artifacts, previously published licenses, or browser caches.
