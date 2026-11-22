# Fieldsense dedicated hostname — activation gate

## Objective
Serve the **existing static Fieldsense lab** at `https://fieldsense.jacobroutzong.dev/`, while retaining the public research case study at `https://jacobroutzong.dev/projects/fieldsense/`. Keep using the **existing Cloudflare Pages project `portfolio-site`** and the same GitHub build. Do **not** create another Worker, Pages project, database, service, or DNS zone.

## Cloudflare configuration (owner dashboard action)
1. Open **Workers & Pages → portfolio-site → Custom domains → Set up a domain**. Enter `fieldsense.jacobroutzong.dev` and follow Cloudflare's activation flow. Check for an existing conflicting `fieldsense` DNS record before changing anything. Since the existing zone is managed in Cloudflare, the Pages association should arrange the CNAME automatically. Keep `jacobroutzong.dev` and all other hostnames unchanged.
2. In the `jacobroutzong.dev` zone, select **Rules → Transform Rules → URL Rewrite Rules → Create rule**. Name it `fieldsense-root-to-lab`. Expression Editor condition:

   ```text
   (http.host eq "fieldsense.jacobroutzong.dev" and http.request.uri.path eq "/")
   ```

   Under **Then → Rewrite to → Static**, set URI path `/projects/fieldsense/lab/` and **Preserve query**. Deploy **only this host-scoped, root-only rule**. Do not create a Redirect Rule; the hostname must remain visible in the address bar.
3. Confirm the custom domain is **Active**, the DNS record stays **Proxied** (so the zone-level rewrite applies), and HTTPS is valid. Do not weaken Cloudflare Access or change other security settings.

## Verification before linking production
- `https://fieldsense.jacobroutzong.dev/` responds with 200 and stays at that hostname (no 301/302 to `jacobroutzong.dev`).
- The rendered page has `#fieldsense-app` with `data-ready=true`, includes the existing 3-field replay, scenario/policy/day controls, and loads `/media/fieldsense/{fieldsense.css,scenarios.js,fieldsense.js}`.
- Strict constraints stop the simulation; balanced day 7 shows MDP 645 m³ vs rule 945 m³ with MDP unmet demand 45.72 m³.
- **Project overview** returns to the case study on `jacobroutzong.dev`.
- `https://jacobroutzong.dev/projects/` still lists Fieldsense under Research + Fun Projects. Existing website root and other apps must continue to work.

## Release ordering
This PR updates the case-study demonstration links to the custom hostname. **Do not merge until the Cloudflare association and rewrite have been activated and verified**, or it would publish broken demo links. Keep the existing `/projects/fieldsense/lab/` route as a working fallback. The PR does not alter the simulation source or its seeded data.

## Rollback
If the custom hostname causes trouble, revert only this PR's link changes to restore the original lab URL. Disable the `fieldsense-root-to-lab` rewrite rule and remove the extra custom-domain association only if necessary; leave the established `jacobroutzong.dev` production hostname intact.
