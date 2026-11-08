---
title: Recursa — Recursive Application Synthesis
summary: A research workbench that uses a contained Recursive Language Model to inspect specifications, synthesize browser applications, and record how each run was verified.
category: AI / Machine Learning
technologies: [Python, Recursive Language Models, TypeScript, Docker, Playwright, Hugging Face Spaces]
draft: false
featured: false
status: In progress
order: 0
sourceUrl: https://github.com/jacobhroutzong/recursa
demoUrl: https://huggingface.co/spaces/jacobroutzong/recursa
screenshots:
  - src: /media/recursa-studio.png
    alt: Recursa Studio Execution Explorer displaying a recorded model call and its timing
    caption: The Execution Explorer exposes timings and verification outcomes for each public benchmark trial.
  - src: /media/recursa-aviation.png
    alt: Aviation Operations board displaying synthetic arrivals, departures, and a stand conflict
    caption: Chromium capture from the Aviation showcase. The verified build includes disclosed host assembly.
videos: []
---

## From specification to verified workflow

Recursa asks what changes when a model can inspect a specification programmatically and make focused model calls. It wraps the official Recursive Language Models runtime with indexed requirements, budget enforcement, artifact verification, and a public Studio for inspecting the evidence.

[Open Studio full screen](https://jacobroutzong-recursa.hf.space/) ·
[Browse the source](https://github.com/jacobhroutzong/recursa) ·
[Read the benchmark protocol](https://github.com/jacobhroutzong/recursa/blob/main/docs/baseline-protocol.md)

## Try the Studio

Open **Generated artifacts** to inspect Task Management, Operations Analytics, or Aviation Operations. Each showcase has source, a screenshot, and four recorded Chromium workflows. Open **Benchmarks** to compare the three methods, then select a trial to see its recorded calls, durations, and verification outcomes. The CPU-hosted Studio serves recorded evidence without requiring an API key.

<iframe src="https://jacobroutzong-recursa.hf.space/" title="Recursa Studio benchmark traces and verified application replays" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="display:block;inline-size:100%;block-size:clamp(36rem,90dvh,64rem);border:1px solid var(--border);border-radius:8px;"></iframe>

## How it works

![Reviewed requirements enter the contained RLM. A host broker enforces model budgets, then returned source goes through build and browser checks. Reviewed evidence goes to the read-only Studio.](/media/recursa-architecture.svg)

The local controller inspects indexed requirements inside a network-disabled container. A host broker mediates the root and sub-model calls and reserves usage before dispatch. Returned files carry requirement references and content hashes. The host checks the source, builds the application, and runs independently authored browser scenarios. Reviewed results are exported separately to the replay service.

An authorized local Qwen run recorded context inspection and a completed subcall. Its initial Task Management candidate built and failed browser checks. After targeted repair and host composition of the filter, it passed the four declared workflows. The Operations and Aviation showcases also include disclosed host corrections or assembly.

## What the comparison measured

The expanded series ran **18 first-pass trials** across three specifications. Direct generation, structured nonrecursive generation, and contained RLM shared the same local Qwen weights, two matched seed blocks, and a per-trial ceiling of 120 seconds, six calls, and 2,304 output tokens per call. The series used zero repairs and zero paid API calls.

| Method | Builds passed / measured | Browser checks passed / measured |
| --- | ---: | ---: |
| Direct LLM | 0 / 2 | Unmeasured |
| Structured | 1 / 1 | 0 / 4 |
| Contained RLM | 1 / 2 | 0 / 4 |

All five measured builds came from Task Management. Operations and Aviation stopped before build measurement after incomplete responses, invalid manifests, or broker rejection. The independent Operations control passed the added sorting and CSV export checks. These results characterize one local model and budget, with too little measured browser coverage to rank the methods.

[Explore the results and 45 benchmark traces](https://jacobroutzong-recursa.hf.space/#benchmarks) ·
[Read the measured outcomes and limitations](https://github.com/jacobhroutzong/recursa/blob/main/docs/baseline-protocol.md#expanded-results)

## Research attribution

The underlying inference method comes from Alex L. Zhang, Tim Kraska, and Omar Khattab. Recursa contributes the application-synthesis orchestration, verification harness, and replay workbench around their runtime. [Recursive Language Models](https://arxiv.org/abs/2512.24601) · [Official implementation](https://github.com/alexzhang13/rlm)
