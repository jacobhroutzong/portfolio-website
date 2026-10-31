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
demoUrl: https://huggingface.co/spaces/jacobroutzong/modelforge
screenshots: []
videos: []
---

## Small models. Measurable progress.

Crucible investigates a specific question: how much useful capability can a small model deliver under a fixed memory, latency, and training budget? The current implementation establishes the evaluation workspace before model adaptation or performance claims.

[Open the app full screen](https://jacobroutzong-modelforge.hf.space/) · [Browse the source](https://huggingface.co/spaces/jacobroutzong/modelforge/tree/main)

## Explore the workspace

The app runs on a free CPU Hugging Face Docker Space. Loading the embed connects your browser to Hugging Face; scoring runs only when you select **Run evaluation**. A sleeping Space may take a moment to start. Use the full-screen link if the embed or browser storage is unavailable.

<iframe src="https://jacobroutzong-modelforge.hf.space/" title="Crucible evaluation and optimization workspace" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:1100px;border:1px solid var(--border);border-radius:8px;"></iframe>

## What works today

- **Evaluation:** edit or import JSONL cases and saved outputs, then score them with the Python evaluator. JSON validity, schema compliance, and semantic correctness are separate measures.
- **Failure inspection:** compare expected and actual actions, including invented arguments, missing responses, and incorrect clarification fields.
- **Experiment comparison:** inspect scores side by side and check whether their evaluation-case hashes match.
- **Memory planning:** vary parameter count, precision, assumed runtime overhead, and GPU memory budget to estimate storage requirements.
- **Research notes:** save browser-local observations and export reports and notes as JSON.

The public API processes submitted data to calculate scores, but does not retain request bodies or reports on its server. Visitor reports remain in browser storage when available. Use public or synthetic data only, and export any report you want to keep; browser storage may be cleared or restricted inside embeds.

## Method and limits

The initial task is single-turn selection among three read-only experiment tools, with explicit clarification when information is missing. The app does not execute proposed tools. Eight hand-authored development cases exercise the scorer; they are public fixtures, not a held-out model benchmark. Their scores do not describe a trained model.

The memory planner uses an analytical weight-storage calculation plus a user-selected overhead allowance. It does not account for every activation, optimizer state, quantization metadata, or implementation buffer, and it cannot guarantee that training or inference fits.

No model inference, fine-tuning, DPO, quantization experiment, or GPU benchmark has been completed. The next research gate is a reviewed validation set and reproducible prompting baseline, followed by controlled SFT, data-quality, quantization, and preference-optimization experiments.

## Engineering and verification

The frontend uses HTML, CSS, and JavaScript. A stateless Python WSGI API serves the public demo through Waitress, with bounded inputs and no model-provider credentials. The portfolio page uses the existing Astro and Cloudflare Pages deployment.

The evaluator and API have executable tests for semantic failures, strict parsing, report isolation, invalid inputs, and public-demo limits. The workspace has also been checked interactively on desktop and at a phone breakpoint. These checks establish application behavior, not model quality.
