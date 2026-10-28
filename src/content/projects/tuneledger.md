---
title: TuneLedger
summary: A reproducible fine-tuning laboratory with pinned QLoRA experiments, dataset integrity checks, recoverable checkpoints, and paired base-versus-adapter evaluation.
category: AI / Machine Learning
technologies: [Python, QLoRA, Qwen3, Experiment tracking, Hugging Face, Google Colab]
draft: false
featured: false
status: In progress
order: 0
sourceUrl: https://huggingface.co/spaces/jacobroutzong/tuneledger/tree/main
demoUrl: https://huggingface.co/spaces/jacobroutzong/tuneledger
screenshots: []
videos: []
---

## Every experiment leaves a trail

TuneLedger focuses on the systems around model adaptation: which data and model
revision ran, how a checkpoint can be recovered, and whether an adapter improves
the same held-out cases as its baseline. The training pipeline is independent
of its execution provider, with Colab as the preferred GPU workspace and
containerized Hugging Face Jobs as the automated alternative.

[Open the workspace full screen](https://jacobroutzong-tuneledger.hf.space/) ·
[Download the complete source ZIP](/downloads/tuneledger-ai-0.3.1.zip) ·
[Browse the demo source](https://huggingface.co/spaces/jacobroutzong/tuneledger/tree/main)

## Explore the CPU workspace

Build a pinned Qwen3 experiment plan, validate conversation JSONL and preview
seeded splits, or score saved responses against reference cases. These tools use
the training package's CPU core. They do not start training, allocate a GPU or
run a model. The built-in cases are synthetic fixtures, not benchmark results.

The embed connects to a free CPU Hugging Face Space. It may need a moment to
wake up. Use public or synthetic inputs only: the shared server processes the
submitted text. The full-screen link works independently of the embed.

<iframe src="https://jacobroutzong-tuneledger.hf.space/" title="TuneLedger experiment planning and dataset validation workspace" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:1050px;border:1px solid var(--border);border-radius:8px;"></iframe>

## Implemented infrastructure

- **Training CLI:** Unsloth and TRL QLoRA with pinned model/tokenizer revisions,
  official-template assistant masking, gradient checkpointing and accumulation.
  Qwen3-4B is the primary target; 0.6B, 1.7B and 8B share the registered implementation.
- **Data integrity:** strict conversation roles, unique IDs, normalized prompt
  checks and source-group separation across train, validation and test splits.
- **Experiment ledger:** resolved configuration, source/data hashes, runtime
  versions, hardware, metrics and lifecycle events.
- **Recovery:** complete Trainer checkpoints include model, optimizer, scheduler
  and RNG state. SHA-256 completion records reject partial or modified saves.
- **Runner adapters:** local and attached Colab execution, immutable HF Jobs
  plans, bounded timeouts, status/log/cancel commands and private Hub recovery.
- **Evaluation:** process-isolated base and adapter inference, exact and typed
  JSON scoring, category reports and regression gates with provenance checks.

The source ZIP includes the installable package, tests, clean Colab notebook,
headless runner, dependency lock, training container recipe and operating guides.
The demo's **Optional inference** tab remains unavailable until a separately
configured model gateway is online.

## What has actually been verified

CPU tests cover configuration, dataset leakage checks, loss masking, report
serialization, runner approval gates, checkpoint checksums, recovery orchestration,
OOM/failure states and public-demo behavior. The real Qwen3-4B tokenizer contract
was checked against the pinned revision, including all 40 smoke examples and a
multiturn conversation. Package builds, clean wheel installation and the local
Gradio HTTP interface were also checked.

Training lifecycle tests use explicit CPU doubles for the model, Trainer and CUDA.
They test state handling, not optimizer mathematics or GPU kernels. No completed
GPU training run, model inference benchmark or measured improvement is claimed.
Live GPU training, optimizer recovery, remote HF Jobs and checkpoint uploads are
the next acceptance gate. Qwen3.5 and gpt-oss remain blocked scaffolds.

## Research boundaries

Use licensed, independently held-out task data before drawing quality conclusions.
Source hashes and normalized duplicates do not detect semantic paraphrases.
Exact matching does not grade open-ended prose; JSON key validity is not a full
schema or semantic correctness check. A compatible dependency lock does not
establish that a model fits a particular GPU.

Private experiment storage and curated public model releases are separate.
Tokens stay in provider secret stores. GPU jobs require an explicitly reviewed
compute allocation; the public demo provisions no paid hardware.
