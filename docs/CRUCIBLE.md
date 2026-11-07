# Crucible deployment

The project overview is at `/projects/modelforge/`; the first-party workspace is at `/apps/crucible/`. The Space remains independently hosted at `jacobroutzong/modelforge`.

The static UI in `public/apps/crucible/` mirrors the Space frontend (source revision `ee943296f840bfeb1666d5d1459da1ba4d3e44b9`), with same-origin assets, a bundled snapshot of the eight public example cases, and portfolio navigation. It can open without a running Space. Browser requests stay on the portfolio origin.

The `/api/crucible/evaluate` Pages Function sends JSON to the existing Python scorer. It forwards no browser cookies or credentials, follows no upstream redirects, and retains no reports. Reports and notes are stored in the portfolio origin's browser storage. Existing reports on the Space origin stay there.

When updating the interface or fixtures, keep the portfolio snapshot in sync with the Space and check that its case contract matches the deployed scorer. Confirm `public/_routes.json` includes the evaluation endpoint and exercise a fixture run on the production domain after publishing.
