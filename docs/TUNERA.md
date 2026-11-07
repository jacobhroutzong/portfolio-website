# Tunera workbench review notes

The Tunera project page keeps its existing `/api/tunera` planner, dataset checker,
and conversation-response scorer. The tool-use Evaluation Lab submits to the
existing `/api/crucible/evaluate` Pages Function and reads the original public
Crucible fixture. The former Crucible project and app URLs redirect to Tunera’s
Evaluation Lab.

Historical web reports use a parsed-case hash. The original CLI reports use a
raw-file hash. Tunera reads either report shape, keeps its contents for export,
and displays deltas only when hash conventions, case hashes, and case IDs match.
Reports stored by the standalone app on the portfolio origin appear in Tunera.
Reports on the Space origin can be exported there and imported here. Notes are
read from the legacy key when no Tunera notes exist, then saved separately.

The Qwen3.5 planner snapshot in `src/data/tunera-qwen35-recipe.json` mirrors
the resolved `configs/qwen3_5_2b.experimental.json` in the Tunera codebase.
Qwen3-4B is selected by default. The workbench makes no model or training calls.
Run status and benchmark panels display locally imported artifacts with their
reported values and provenance. The hardware planner is an analytical estimate.

Review the release with the portfolio build and `tests/e2e/tunera.spec.ts`.
