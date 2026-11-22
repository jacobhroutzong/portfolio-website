# Fieldsense editorial redesign — November 2026

**Scope:** Presentation only. No changes to the original synthetic dataset, three-model algorithms, scenario serialization, deterministic seeds, or existing Cloudflare infrastructure.

## Visual direction

The site is structured as a field atlas: large restrained serif typography, a warm field-notebook surface, fine green rules, muted ochre provenance cues, and a dark topographic simulation stage. It avoids generic hero slogans, repeated floating cards, illustrations that imply field measurements, and excessive motion. The current interactive SVG farm, policy controls, seven-day replay, and charts remain in place, with an additive CSS layer so upstream simulation files remain pinned and untouched. No new fonts, libraries, image hosts, or backend services are used.

## Original paper excerpts

These sentences were copied verbatim from the user's 2025 Georgia Tech ISYE 6501 source document, **Course Project Iyse 6501.docx**. The original document remains private and unchanged.

- **Part 2 (Models Defining)**: “To best allocate resources, we will implement Mixed-Integer Linear Programming, a model well suited for allocation problems.”
- **Part 2 (Models Defining)**: “We will use Markov Chain Decision Process to prescribe optimal irrigation actions (when/where and how much to water) using probabilistic models of weather and soil states.”
- **Part 3 (Explanation of Proposed Tech Stack)**: “The data input to the system is crucial to making the most accurate predictions and most consistent outcomes.”

The quotes reflect the original project proposal, not current sensor deployment. The previous paper's unverified $600/month assertion is retained only as historical context, not repeated as a verified operating cost. The MDP-vs-rule result includes both irrigation volume and area-weighted unmet crop-water demand.

## Acceptance and release

- Paper quotes exact; originally proposed system clearly distinguished from the reproducible 2026 local Python simulation and public recorded replay.
- All preexisting replay control IDs and deterministic data remain intact, with color contrast and reduced-motion rules.
- Desktop and mobile local preview checked at 1440, 800, 390, and 360px; day seven, dry and infeasible scenarios, policy switching and input controls remain functional.
- Additive stylesheet loaded after the original public stylesheet; pinned data/CSS/JS from v1.1 unchanged.
- Existing publication boundary must accept the added CSS asset and one new E2E test. CI and Cloudflare preview must pass before merge.

This change is a design milestone, not an authorization for production release. Publish only after owner review.
