# Crucible deployment

The former portfolio overview at `/projects/modelforge/` and workspace at
`/apps/crucible/` redirect to `/projects/tunera/#evaluation-lab`. The original
source remains in the portfolio history and the `jacobroutzong/modelforge` Space.

Tunera loads the original eight public example cases from
`/apps/crucible/fixture.json`. The portfolio redirects apply to page URLs.

The `/api/crucible/evaluate` Pages Function sends JSON to the existing Python scorer. It forwards no browser cookies or credentials, follows no upstream redirects, and retains no reports. Reports and notes are stored in the portfolio origin's browser storage. Existing reports on the Space origin stay there.

When updating fixtures, keep the portfolio snapshot in sync with the Space and
check that its case contract matches the deployed scorer.
