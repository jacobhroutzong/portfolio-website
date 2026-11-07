---
title: Crucible
summary: A small-model research workspace with strict tool-use evaluation, inspectable failures, saved-output comparisons, and an analytical memory planner.
category: AI / Machine Learning
technologies: [Python, JavaScript, Model evaluation, Docker, Hugging Face Spaces]
draft: false
featured: false
status: In progress
order: 1
sourceUrl: https://huggingface.co/spaces/jacobroutzong/modelforge/tree/main
screenshots: []
videos: []
---

## Small models. Measurable progress.

Crucible investigates a specific question: how much useful capability can a small model deliver under a fixed memory, latency, and training budget? The current implementation establishes the evaluation workspace before model adaptation or performance claims.

## Explore the workspace

<a class="button primary" href="/apps/crucible/">Open Crucible →</a>

Explore the examples and memory planner directly on this site. When you select **Run evaluation**, the site forwards the inputs to a Python scorer on Hugging Face and displays the report in the workspace. Scoring may take a moment if the backend is waking up.

## What works today

- **Evaluation:** edit or import JSONL cases and saved outputs, then score them with the Python evaluator. JSON validity, schema compliance, and semantic correctness are separate measures.
- **Failure inspection:** compare expected and actual actions, including invented arguments, missing responses, and incorrect clarification fields.
- **Experiment comparison:** inspect scores side by side and check whether their evaluation-case hashes match.
- **Memory planning:** vary parameter count, precision, assumed runtime overhead, and GPU memory budget to estimate storage requirements.
- **Research notes:** save browser-local observations and export reports and notes as JSON.

The public API processes submitted data to calculate scores and does not retain request bodies or reports. Reports and notes are stored in this site's browser storage when available. Use public or synthetic data only, and export reports you want to keep. Reports saved by the older embedded app remain in the browser storage of that app's original domain.

## Method and limits

The initial task is single-turn selection among three read-only experiment tools, with explicit clarification when information is missing. The app does not execute proposed tools. Eight hand-authored development cases exercise the scorer; they are public fixtures, not a held-out model benchmark. Their scores do not describe a trained model.

The memory planner uses an analytical weight-storage calculation plus a user-selected overhead allowance. It does not account for every activation, optimizer state, quantization metadata, or implementation buffer, and it cannot guarantee that training or inference fits.

No model inference, fine-tuning, DPO, quantization experiment, or GPU benchmark has been completed. The next research gate is a reviewed validation set and reproducible prompting baseline, followed by controlled SFT, data-quality, quantization, and preference-optimization experiments.

## Engineering and verification

Cloudflare Pages serves the interface and public examples. A Pages Function forwards scoring requests to the stateless Python API on a free CPU Hugging Face Space. Evaluation uses bounded inputs and does not require an account or API key.

The evaluator and API have executable tests for semantic failures, strict parsing, report isolation, invalid inputs, and public-demo limits. The workspace has also been checked interactively on desktop and at a phone breakpoint. These checks establish application behavior, not model quality.
