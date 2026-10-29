---
title: Recursa — Recursive Application Synthesis
summary: A CPU-first research workbench for external specification inspection, dependency-aware synthesis plans, resumable experiments, and transparent execution replays. Genuine model-backed synthesis is the next verification gate.
category: AI / Machine Learning
technologies: [Python, Recursive Language Models, JavaScript, Experiment tracking, Docker, Hugging Face Spaces]
draft: false
featured: false
status: In progress
order: 0
sourceUrl: https://github.com/jacobhroutzong/recursa
demoUrl: https://huggingface.co/spaces/jacobroutzong/recursa
screenshots:
  - src: /media/recursa-studio.png
    alt: Recursa Studio showing a recorded deterministic requirement-validation trace and its node inspector
    caption: Actual local Studio capture of a CPU validation run. This is infrastructure evidence, not model-backed recursion.
videos: []
---

## Build beyond the context window

Recursa investigates whether a Recursive Language Model can synthesize software
more reliably by exploring a large application specification in an external
Python environment. The intended controller selects relevant requirements,
invokes focused sub-model calls, assembles source artifacts, and verifies the
result under explicit execution budgets.

This is an **in-progress engineering and research project**. The published
workspace makes the current evidence inspectable without presenting unfinished
capabilities as completed results.

[Open Studio full screen](https://jacobroutzong-recursa.hf.space/) ·
[Browse the source](https://github.com/jacobhroutzong/recursa) ·
[Read the ordered implementation record](https://github.com/jacobhroutzong/recursa/blob/main/docs/implementation-progress.md)

## Explore the progress demo

Select a recorded CPU run, follow its dependency-validation events, open the node
inspector, and export the saved report. The public application is **CPU-only and
replay-only**: it does not start a model, execute visitor code, or provision a GPU.
No API key is needed.

The embedded Studio shows the currently published build and its development
status. Updates represent reviewed releases of the workbench; recorded traces
remain labeled by their actual execution mode. The full-screen link works
independently of the embed. A sleeping Hugging Face Space may take a moment to
wake up.

<iframe src="https://jacobroutzong-recursa.hf.space/" title="Recursa Studio development progress and recorded CPU execution explorer" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:1050px;border:1px solid var(--border);border-radius:8px;"></iframe>

## Implemented foundation

- **External specifications:** stable requirement IDs, dependencies, sections,
  hierarchy, acceptance criteria, schemas, and bounded indexed inspection.
- **Official runtime integration:** a pinned `rlms` adapter with separate root
  and sub-model configuration, pre-dispatch usage reservations, and private
  upstream trajectory capture.
- **Synthesis planning:** dependency-aware task states, refinement of pending
  tasks, validated intermediate artifacts, and declared-interface lookup.
- **Verification infrastructure:** artifact path and provenance checks,
  non-executing JavaScript/JSON syntax checks, and declared requirement-coverage
  reports. These checks do not establish functional application success.
- **Reproducibility:** source/configuration fingerprints, per-trial checkpoints,
  JSON/CSV/ZIP exports, and a prepared Colab notebook with durable Drive output.

## Evidence and remaining work

Offline integration tests exercise the official RLM's REPL and subcall wiring
with **scripted HTTP responses**. They verify context handling, state transitions,
budget exhaustion, artifact persistence, and report generation. Those fixtures
are not genuine model reasoning, generated application examples, or research
benchmarks. The public CPU captures are deterministic validation runs.

Genuine model-backed synthesis remains unverified. Full compilation, functional
application tests, bounded repair, two independently verified generated apps,
and fair direct/structured/RLM comparisons are still required. No measured
advantage, reproduced paper result, or statistical significance is claimed.

Colab is reserved for later authorized accelerator experiments. Its notebook
execution and GPU recovery have not yet been verified. The public Space stays
independent of paid inference and GPU availability.

## Research attribution

The underlying method comes from Alex L. Zhang, Tim Kraska, and Omar Khattab's
[Recursive Language Models](https://arxiv.org/abs/2512.24601) and the
[official RLM implementation](https://github.com/alexzhang13/rlm). Recursa's
contribution is the application-synthesis workbench, orchestration, validation,
and planned independent evaluation around that runtime.
