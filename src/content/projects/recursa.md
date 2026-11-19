---
title: Recursa Studio
summary: Recursive AI systems research across two areas. Application Synthesis studies how models build from specifications. Agent Optimization studies how agents revise the harnesses that guide them.
category: AI / Machine Learning
technologies: [Python, Recursive Language Models, Agent systems, TypeScript, FastAPI, Docker, Playwright]
draft: false
unlisted: true
featured: false
status: In progress
order: 0
screenshots:
  - src: /media/recursa-studio.png
    alt: Recursa Studio Execution Explorer displaying a recorded model call and its timing
    caption: The Execution Explorer exposes timings and verification outcomes for each public benchmark trial.
  - src: /media/recursa-aviation.png
    alt: Aviation Operations board displaying synthetic arrivals, departures, and a stand conflict
    caption: Chromium capture from the Aviation showcase. The verified build includes disclosed host assembly.
videos: []
---

<nav class="button-row" aria-label="Recursa Studio research areas">
  <a class="button secondary" href="/projects/recursa/studio/">Open Application Synthesis replay</a>
  <a class="button secondary" href="/projects/harness2-lab/">Open Agent Optimization lab</a>
</nav>

## Application Synthesis

Recursa asks what changes when a model can inspect an external specification programmatically and issue focused subcalls. It wraps the official Recursive Language Models runtime with indexed requirements, budget enforcement, artifact verification, and a public Studio for inspecting the evidence.

### Explore the replay

Open **Generated artifacts** to inspect Task Management, Operations Analytics, or Aviation Operations. Each showcase has source, a screenshot, and four recorded Chromium workflows. Open **Benchmarks** to compare the three methods, then select a trial to see its recorded calls, durations, and verification outcomes. The public Studio serves saved evidence without an API key or live generation.

[Recursa source](https://github.com/jacobhroutzong/recursa) · [Hugging Face replay](https://jacobroutzong-recursa.hf.space/) · [Recursa license](/projects/recursa/studio/LICENSE.txt) · [Recursa notice](/projects/recursa/studio/NOTICE.txt)

### How it works

![Reviewed requirements enter the contained RLM. A host broker enforces model budgets, then returned source goes through build and browser checks. Reviewed evidence goes to the read-only Studio.](/media/recursa-architecture.svg)

The local controller inspects indexed requirements inside a network-disabled container. A host broker mediates the root and sub-model calls and reserves usage before dispatch. Returned files carry requirement references and content hashes. The host checks the source, builds the application, and runs independently authored browser scenarios. Reviewed results are exported separately to the replay service.

An authorized local Qwen run recorded context inspection and a completed subcall. Its initial Task Management candidate built and failed browser checks. After targeted repair and host composition of the filter, it passed the four declared workflows. The Operations and Aviation showcases also include disclosed host corrections or assembly.

### What the comparison measured

The expanded series ran **18 first-pass trials** across three specifications. Direct generation, structured nonrecursive generation, and contained RLM shared the same local Qwen weights, two matched seed blocks, and a per-trial ceiling of 120 seconds, six calls, and 2,304 output tokens per call. The series used zero repairs and zero paid API calls.

| Method | Builds passed / measured | Browser checks passed / measured |
| --- | ---: | ---: |
| Direct LLM | 0 / 2 | Unmeasured |
| Structured | 1 / 1 | 0 / 4 |
| Contained RLM | 1 / 2 | 0 / 4 |

All five measured builds came from Task Management. Operations and Aviation stopped before build measurement after incomplete responses, invalid manifests, or broker rejection. The independent Operations control passed the added sorting and CSV export checks. These results characterize one local model and budget, with too little measured browser coverage to rank the methods. Deterministic CPU checks and scripted fixtures validate the workflow. The repaired or host-assisted showcase passes are tracked separately from the unassisted first-pass trials. Missing outcomes and costs remain unmeasured.

[Explore the results and 45 benchmark traces](/projects/recursa/studio/#benchmarks) ·
[Read the measured outcomes and limitations](https://github.com/jacobhroutzong/recursa/blob/main/docs/baseline-protocol.md#expanded-results)

### Research attribution

The underlying inference method comes from Alex L. Zhang, Tim Kraska, and Omar Khattab. Recursa contributes the application-synthesis orchestration, verification harness, and replay workbench around their runtime. [Recursive Language Models](https://arxiv.org/abs/2512.24601) · [Official implementation](https://github.com/alexzhang13/rlm)

## Agent Optimization

Harness² Lab studies how an agent can improve the harness around a frozen model. In Propose → Probe → Compose, it proposes changes to prompts, rules, memory, tools, and skills, probes candidate behavior, and uses the execution evidence to compose and select a harness. Reflection records reusable lessons in a per-domain library.

### Explore the interactive lab

Choose **Run the offline demo** to process three finance tasks and inspect candidates and execution traces. **Library** shows retained lessons and adopted harnesses. The Observatory follows edit lineage, and **Budget Lab** compares fixed and adaptive recursion in the simulator.

[Harness² Lab source](https://github.com/jacobhroutzong/harness2-lab) · [Hugging Face lab](https://huggingface.co/spaces/jacobroutzong/harness2-lab) · [Harness² license](/harness2-lab/LICENSE) · [Harness² notice](/harness2-lab/NOTICE)

### How it works

The lab implements parallel and sequential recursion, blind selection, eight editable harness components, and nine tasks across finance, operations, and analytics. Task graders are held out of the improvement loop. The first-party frontend streams run events through the existing Cloudflare Pages proxy to the FastAPI service on Hugging Face Spaces. [Published frontend revision](https://github.com/jacobhroutzong/harness2-lab/tree/99e357702747695c5b9a5047109e07acd8c3b312/app/static)

### What the simulator measures

The default backend is a scripted, stochastic simulator that runs without an account or API key. Its scores and adaptive compute charts describe the simulated tasks. Model-backed gains and reproduction of the paper's results require separate measurements. Published lab validation includes 43 offline tests and a three-task browser demonstration.

The optional model backends were tested with fake clients, and live paid execution remains unverified. Choosing a model backend sends the supplied key to the hosted lab for that run. The estimated cost threshold is checked between tasks, and dollar costs for OpenAI-compatible backends are unavailable. The subprocess runner limits resources and scrubs its environment. It does not provide operating-system isolation.

### Research attribution

Harness² Lab independently implements the method described by Xu et al. [Harness²: Recursive Agent Harnessing for an Open World](https://arxiv.org/abs/2610.14224)

Recursa and Harness² retain separate implementations and evidence. No matched experiment has measured whether Harness² improves Recursa's synthesis outcomes.
