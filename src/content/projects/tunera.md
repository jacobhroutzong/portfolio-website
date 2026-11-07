---
title: Tunera
brandLogo: /media/tunera/mark.svg
summary: Plan Qwen fine-tuning, prepare datasets, and evaluate saved responses in one workbench.
category: AI / Machine Learning
technologies: [Qwen3, QLoRA, Training checkpoints]
draft: false
featured: false
status: In progress
order: 0
sourceUrl: https://huggingface.co/spaces/jacobroutzong/tuneledger/tree/main
screenshots: []
videos: []
---

## What it does

Tunera is a Python toolkit for fine-tuning Qwen3 language models on your own
examples. It checks the data, records the settings, saves training progress, and
compares the adapted model with the original on the same test cases.

The Evaluation Lab uses Crucible's existing strict tool-use scorer. It keeps JSON
parsing, schema compliance, and exact action correctness separate. You can work
through examples, inspect failures, and compare or export saved reports. Those
scores describe submitted responses. Live training and model benchmarks are run
separately through the CLI.

It uses **QLoRA**: the base model's weights are stored in 4-bit form to reduce
memory use, while training updates small extra weight matrices called **adapters**.
The base model's billions of weights stay frozen.

<div style="display:flex;flex-wrap:wrap;gap:14px 24px;align-items:center;margin:24px 0;font-size:14px">
<span style="display:inline-flex;align-items:center;gap:8px"><img src="/media/tunera/python.svg" width="22" height="22" alt="" />Python</span>
<span style="display:inline-flex;align-items:center;gap:8px"><img src="/media/tunera/pytorch.svg" width="22" height="22" alt="" />PyTorch</span>
<span style="display:inline-flex;align-items:center;gap:8px"><img src="/media/tunera/huggingface.svg" width="22" height="22" alt="" />Hugging Face</span>
<span style="display:inline-flex;align-items:center;gap:8px"><img src="/media/tunera/googlecolab.svg" width="22" height="22" alt="" />Google Colab</span>
</div>

[Download the source ZIP](/downloads/tunera-ai-0.3.1.zip)

## What the settings mean

The four controls in **Plan an experiment** change the following settings. Their
defaults are starting values for testing, not a claim that they are best for every task.

| Control | Default | What it changes |
| --- | --- | --- |
| **Model and training strategy** | **Qwen3-4B QLoRA** | 4B means roughly four billion learned weights. Qwen3 sizes from 0.6B to 8B use 4-bit base weights in the QLoRA recipe. The separate Qwen3.5-2B experiment uses BF16 weights and requires a GPU with native BF16 support. |
| **Maximum context tokens** | **512** | The cap for the prompt and answer together in each example. A token is a piece of text, sometimes part of a word. Longer examples need more memory. Text beyond this cap is cut off; training rejects an example if no answer tokens remain. |
| **LoRA rank** | **16** | The size of the adapter matrices being trained. A higher rank gives the adapter more capacity and uses more memory. It does not guarantee better answers. |
| **Optimizer steps** | **100** | The number of weight updates. This is not the number of unique examples or full passes through the dataset. Training can see the same examples more than once. |

### Other settings in the generated configuration

| Setting | Default | Meaning |
| --- | --- | --- |
| `learning_rate` | `0.0002` | Controls the size of the optimizer's weight adjustments. Too high can make training unstable; too low can slow learning. |
| `batch_size` | `1` | Examples processed together on the GPU. Increasing it usually needs more memory. |
| `gradient_accumulation_steps` | `4` | Small batches collected before one update. With batch size 1 on one GPU, the effective batch is 4 examples. |
| `lora_alpha` | `32` | Scales the adapter's contribution. The usual LoRA scale is alpha divided by rank: 32 / 16 = 2 with these defaults. Changing rank while keeping alpha fixed also changes that scale. |
| `save_steps` / `eval_steps` | `20` / `20` | Save a checkpoint and check validation loss every 20 updates. A stopped runtime can lose work since its last saved checkpoint. |
| `seed` | `42` | Controls random choices such as data shuffling. Keeping it fixed helps repeat an experiment, but does not make all GPU results bit-for-bit identical. |
| `assistant_only_loss` | `true` | Train on the final assistant answer. Earlier messages provide context and are not scored as training targets. |

The JSON output also records the exact model revision. That keeps a later run
from silently downloading a different version of the same model.
For the adapter formulas, see the [PEFT LoRA reference](https://huggingface.co/docs/peft/en/package_reference/lora).

## From a plan to a training run

The source includes a command-line trainer, a Colab runner and an HF Jobs runner.
Each run records its configuration, data hashes, software versions and metrics.
A recoverable checkpoint contains the adapter weights **and** optimizer, scheduler
and random state. The final adapter alone cannot resume the same training run.

After training, the original model and adapter are tested separately on the same
held-out cases. Reports include answer accuracy, JSON checks, speed and GPU memory
measurements. Test data stays out of training and model selection.

## Current status

**Working and tested:** the CPU planner, Dataset Studio, saved-response and
tool-use evaluation, report import and export, and checkpoint-handling code.
Qwen3-4B remains the default recipe.

**Experimental:** Qwen3.5-2B has a pinned BF16 LoRA recipe and a verified tokenizer
contract. A tiny random-weight model exercised optimizer recovery on CPU.
Full-model GPU training, recovery and paired evaluation remain the acceptance
gate. The other Qwen3.5 sizes and gpt-oss are roadmap candidates.
