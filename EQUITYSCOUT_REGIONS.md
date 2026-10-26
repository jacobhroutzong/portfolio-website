# Southeast-first research — October 26, 2026

The default results tab is **Southeast**, defined exactly as FL, AL, GA, SC, NC,
TN and MS. **Nationwide** includes saved records in every U.S. state plus DC,
including Southeast. It is a broader comparison view, not a disjoint queue.
Changing tabs does not duplicate, delete, fetch or re-underwrite properties.
Search, state and sorting choices are remembered independently per tab while
the page is open. A new page starts in Southeast.

## Candidate cities and qualification

Southeast initially uses the 42 existing city candidates from the supplied
`app.py` catalog. These preserve the original research scope, rather than
introducing a new unsupported market ranking:

| State | Original candidate cities |
|---|---|
| Florida | Jacksonville, Lakeland, Winter Haven, Ocala, Pensacola, Tallahassee, Daytona Beach, Deltona |
| Alabama | Birmingham, Montgomery, Dothan, Gadsden, Anniston, Mobile |
| Georgia | Warner Robins, Macon, Augusta, Columbus, Albany, Valdosta |
| South Carolina | Columbia, Spartanburg, Sumter, Florence, Anderson, Orangeburg |
| North Carolina | Fayetteville, Greensboro, Winston-Salem, High Point, Rocky Mount, Burlington |
| Tennessee | Memphis, Jackson, Chattanooga, Clarksville, Knoxville |
| Mississippi | Jackson, Hattiesburg, Tupelo, Meridian, Gulfport |

The shortlist filter is on by default. Other saved cities in these seven states
remain available through an explicit checkbox showing the additional record
count. Nationwide retains all U.S. records even when a city is outside the
original 20-state market guide. Geography is a research filter, not an access
control or a financial PASS gate.

The original financial rules remain: target all-in cost at or below 75% of
conservative verified renovated ARV, target at least $250/month cash flow after
reserves, and the configured DSCR/LTV and seasoning requirements. Prioritize
affordable 3–4-bedroom houses and small multifamily. Evidence for sold renovated
comps, rehab, taxes, insurance, lender terms and local rent approval remains
required. These are editable policy targets, not guarantees.

This change does not claim the 42 cities are currently the best investment
markets. A current city comparison still needs actual acquisition/rehab spreads,
ZIP/PHA schedules, utilities, insurance/flood exposure, taxes, contractor and
management coverage, realistic financing and exit liquidity. The previous UI's
automatic S+/S/A/B labels were assigned by catalog position; those unsupported
labels have been removed. Imported properties still need individual evidence.

[HUD's HCV guidebook](https://www.hud.gov/helping-americans/housing-choice-vouchers-guidebook)
separates payment standards, rent reasonableness, utility allowances and HAP
contracts. [HUD FMRs](https://www.huduser.gov/portal/datasets/fmr.html) provide
periodic gross-rent context and must not be treated as approved contract rent.

## Portfolio login recommendation

Keep the project description, screenshots and synthetic calculator public.
Link to an owner-only sign-in portal for actual records. Keep every API, export,
source attachment and stored result behind server-side authorization. A visible
portfolio link can coexist with private results; hiding the URL is not security.
For private data prefer opening the authenticated app as a top-level page; an
embedded frame should have a full-screen fallback and must not weaken login to
make the frame work. Do not publish real records in static portfolio artifacts.

The owner's updated publishing instructions prefer Hugging Face Spaces for
Python applications. `hf auth whoami` verified `jacobroutzong` on October 26.
The prior Cloudflare/D1 implementation remains a draft alternative, not the
selected production deployment. A private Space deployment still needs durable
storage and production authorization verification; CLI login alone does not
complete those. No production hosting changes are part of this regional update.

## Recommended refresh policy — not activated

| Data/work | Starting cadence |
|---|---|
| Southeast active-listing changes | Daily, limited to configured shortlisted markets and a hard provider call budget |
| Nationwide comparison sweep | Weekly; reuse Southeast observations instead of fetching them twice |
| County tax/code/auction sources | Daily or weekly according to source publication rate, entitlement and terms |
| Comps and rent research | On demand for shortlisted leads; refresh stale evidence before an offer |
| PHA schedules / insurance / lender terms | Check effective dates and changes; reverify for each actual transaction |
| Display of already saved results | Manual or occasional cache read; separate from paid source requests |

Recurring ingestion should use a durable server job/queue, idempotent parcel
deduplication, overlap prevention, retries/backoff, source timestamps, last
successful run/error status and budget accounting. Preserve reviewed assumptions
when new observations arrive and require new signoff for changed economics.
Start with a few operationally manageable metros before sweeping all 42 cities.
Send only material-change alerts if the owner chooses notifications later.

No timer, automation, paid request or scheduled scan was enabled. Cloud provider
ingestion is still disabled; the local adapter requires a sanctioned provider,
license acknowledgment and configured call allowance. A browser being open is
not a reliable scheduler.

## Verification

Five regional tests exercise the actual interface functions: exact state/city
scope, nationwide coverage outside the guide, independent filters, explicit
other-city opt-in and market-guide/accessible tab markup. The 54 Python tests
pass. Browser verification used isolated, clearly synthetic data on port 8766:
Southeast showed two original candidates while Nationwide retained all eight
saved examples, including California. Desktop and 390-pixel layouts inspected.
Screenshots: `docs/screenshots/southeast-results.png` and
`docs/screenshots/southeast-results-mobile.png`.
