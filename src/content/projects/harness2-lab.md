---
title: Harness² Lab
summary: An interactive Python implementation of recursive agent harnessing, with live execution traces, a reusable harness library, and an adaptive compute budget experiment.
category: AI / Machine Learning
technologies: [Python, FastAPI, Agent systems, Docker, Hugging Face Spaces]
draft: false
featured: false
status: In progress
order: 2
sourceUrl: https://github.com/jacobhroutzong/harness2-lab
screenshots: []
videos: []
---

## Improve the harness around a frozen model

Harness² Lab is an independent implementation of [Harness²: Recursive Agent Harnessing for an Open World](https://arxiv.org/abs/2610.14224). It makes the method inspectable: propose edits to an agent's prompts, rules, memory, tools and skills; probe their effects; compose a harness from the execution evidence; then retain supported lessons for later tasks.

[Explore the source](https://github.com/jacobhroutzong/harness2-lab)

## Try it here

The default simulator needs no account or API key. Choose **Run the offline demo** to process three finance tasks, inspect the candidate harnesses and execution traces, then open **Library** to see the retained lessons. **Budget Lab** compares fixed and adaptive recursion in the built-in toy world.

The lab runs here on the portfolio. The Python backend runs on Hugging Face Spaces and may take a moment to wake up. If you choose a live model backend, the key you enter is sent to the hosted lab for that run.

## Implemented and checked

- Parallel and sequential Propose → Probe → Compose loops, blind selection, reflection, and a per-domain library.
- Eight editable harness components, validation, tool execution, and lineage inspection.
- Nine tasks across finance, operations, and analytics, with graders hidden from the improvement loop.
- FastAPI event streaming and a browser interface for the run history, library, and budget experiments.
- 43 passing offline tests and a completed three-task browser demonstration.

## What the results mean

The default backend is a scripted, stochastic simulator running through the same pipeline. Its scores and Budget Lab charts describe this toy world; they are not a reproduction of the paper's benchmark results.

Anthropic and OpenAI-compatible backends are implemented and covered by fake-client tests. Live paid API execution has not been verified. Estimated cost thresholds are checked between tasks and are not hard provider billing limits; OpenAI-compatible dollar costs are currently unavailable. The subprocess runner provides resource limits and a scrubbed environment, not an operating-system security boundary.

Cloudflare Pages serves the interface and streams requests to the Hugging Face Docker Space. The frontend assets are based on [Harness² Lab revision 99e3577](https://github.com/jacobhroutzong/harness2-lab/tree/99e357702747695c5b9a5047109e07acd8c3b312/app/static). The project retains its [Apache-2.0 license](/harness2-lab/LICENSE) and [original attribution](/harness2-lab/NOTICE).

