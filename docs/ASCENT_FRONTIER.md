# Ascent frontier curriculum review

Research cutoff and source verification: **2026-11-07**. Baseline: portfolio main at **becf053**, which already includes the curriculum-depth work from PR #2. This is a selected engineering curriculum, not an exhaustive release tracker or a claim about private lab interviews.

## Before and after

| Coverage | Before | After |
| --- | ---: | ---: |
| Advanced concepts / original interview prompts | 30 / 30 | 42 / 42 |
| Domains | 6 | 6 |
| Study paths | 4 | 4 expanded |
| Executable problems | 29 | 34 |
| Foundation lessons / exercises | 11 / 66 | 11 / 66 |
| Reference-solution assertions | 319 | 374 |

| Domain | Before | After | Added |
| --- | ---: | ---: | --- |
| Architecture | 4 | 7 | moe-routing, mla-cache, multimodal-grounding |
| Inference | 4 | 7 | quantized-serving, serving-goodput, adaptive-test-compute |
| Training | 6 | 8 | distributed-sharding, training-data-lineage |
| Post-training | 6 | 7 | verifier-robustness |
| Evaluation | 4 | 5 | budgeted-agent-evals |
| Applied systems | 6 | 8 | durable-agent-recovery, computer-use-boundaries |

Existing concept and question objects are unchanged, including IDs, prerequisites, sources and exercise roles. The four path IDs and prior member order are preserved. Progress keys, IndexedDB and backup formats are unchanged.

## New interview questions and what they test

| Priority | Concept / question ID | Reasoning expected | Direct application |
| --- | --- | --- | --- |
| P0 | moe-routing / q-moe-routing | Derive active versus resident costs and diagnose rank skew separately from a slow link. | moe-budget |
| P0 | mla-cache / q-mla-cache | Calculate GQA and MLA budgets; explain why physical memory, speed and quality need separate measurements. | mla-cache-budget |
| P0 | distributed-sharding / q-distributed-sharding | Localize the exposed collective path at a fixed effective batch before changing group topology. | None; linked prerequisite only |
| P0 | durable-agent-recovery / q-durable-agent-recovery | Reconcile the ambiguous crash window and design a test against duplicated external effects. | recovery-plan |
| P0 | budgeted-agent-evals / q-budgeted-agent-evals | Compare systems at equal budgets using task-family uncertainty, repeats and separate safety outcomes. | None; linked prerequisite only |
| P0 | verifier-robustness / q-verifier-robustness | Diagnose proxy/audit divergence and design a verifier release gate that detects false accepts. | None; linked prerequisite only |
| P1 | quantized-serving / q-quantized-serving | Choose a measured format under hard quality, latency and memory gates; defend the cost denominator. | quantization-gate |
| P1 | multimodal-grounding / q-multimodal-grounding | Identify shortcut use and test whether the model follows changed visual evidence under a fixed budget. | None; linked prerequisite only |
| P1 | training-data-lineage / q-training-data-lineage | Trace contamination through synthetic descendants and re-establish an independent evaluation. | lineage-overlap |
| P1 | serving-goodput / q-serving-goodput | Decide whether a serving topology improves eligible completions per dollar at the target workload. | None; linked prerequisite only |
| P1 | computer-use-boundaries / q-computer-use-boundaries | Bind browser actions to the actual authorized resource and test stale consent and injection. | None; linked prerequisite only |
| P1 | adaptive-test-compute / q-adaptive-test-compute | Choose among sampling, escalation and stopping using calibrated expected gain and a hard deadline. | None; linked prerequisite only |

Each note supplies an original scenario, equation or systems invariant, worked answer, two follow-ups, at least four rubric criteria, and pitfalls. Application checks assess the named component only; they are not proof of GPU, browser security, or workflow deployment readiness.

## Study path inventory

- **transformer-depth** (5 → 8): attention-contract → rope → kv-cache → gqa → flash-attention → mla-cache → moe-routing → multimodal-grounding.
- **reliable-training** (15 → 18): benchmark-validity → reproducibility → data-pipeline → training-data-lineage → compute-budget → adamw → gradient-accumulation → mixed-precision → distributed-sharding → token-loss-contract → sft-data → lora → qlora-precision → paired-evaluation → preference-data → dpo → reasoning-verifiers → verifier-robustness.
- **inference-systems** (7 → 12): kv-cache → gqa → paged-attention → continuous-batching → speculative-decoding → qlora-precision → performance-diagnosis → mla-cache → moe-routing → quantized-serving → serving-goodput → adaptive-test-compute.
- **evidence-systems** (9 → 12): benchmark-validity → reproducibility → retrieval-contract → rag-evaluation → tool-reliability → agent-permissions → context-state → agent-evaluation → paired-evaluation → durable-agent-recovery → budgeted-agent-evals → computer-use-boundaries.

Cross-path prerequisites can be recommended before an entry without locking it. Capstones now explicitly ask for cache accounting, holdout/verifier controls, cost per eligible completion, or fault injection and scope checks.

## Concept, dependency and exercise inventory

| Status | Concept | Question ID | Prerequisites | Related concepts | Linked exercise (role) |
| --- | --- | --- | --- | --- | --- |
| Existing | attention-contract | q-attention-contract | — | kv-cache, gqa | multihead (application) |
| Existing | gqa | q-gqa | kv-cache | kv-cache, rope | multihead (prerequisite) |
| Existing | rope | q-rope | attention-contract | kv-cache, flash-attention | attention-head (prerequisite) |
| Existing | flash-attention | q-flash-attention | attention-contract, mixed-precision | gqa, kv-cache | softmax-stable (prerequisite) |
| Existing | kv-cache | q-kv-cache | rope | rope, continuous-batching | kv-append (application) |
| Existing | continuous-batching | q-continuous-batching | kv-cache | paged-attention | kv-append (prerequisite) |
| Existing | paged-attention | q-paged-attention | kv-cache | continuous-batching, speculative-decoding | kv-append (prerequisite) |
| Existing | speculative-decoding | q-speculative-decoding | continuous-batching | continuous-batching, compute-budget | softmax-stable (prerequisite) |
| Existing | compute-budget | q-compute-budget | reproducibility, data-pipeline | data-pipeline, adamw | accumulate-grads (prerequisite) |
| Existing | adamw | q-adamw | — | gradient-accumulation | adamw-update (application) |
| Existing | gradient-accumulation | q-gradient-accumulation | adamw | mixed-precision | accumulate-grads (application) |
| Existing | mixed-precision | q-mixed-precision | gradient-accumulation | flash-attention, lora | cross-entropy (prerequisite) |
| Existing | lora | q-lora | sft-data | sft-data | lora-delta (application) |
| Existing | sft-data | q-sft-data | token-loss-contract, benchmark-validity, reproducibility | preference-data, dpo | assistant-labels (application) |
| Existing | dpo | q-dpo | sft-data, preference-data | preference-data | dpo-loss (application) |
| Existing | preference-data | q-preference-data | paired-evaluation | dpo, paired-evaluation | entropy (prerequisite) |
| Existing | paired-evaluation | q-paired-evaluation | benchmark-validity | benchmark-validity | paired-outcomes (application) |
| Existing | benchmark-validity | q-benchmark-validity | — | paired-evaluation, rag-evaluation | first-repeat (prerequisite) |
| Existing | rag-evaluation | q-rag-evaluation | retrieval-contract | retrieval-contract, reproducibility | retrieval-metrics (application) |
| Existing | reproducibility | q-reproducibility | — | data-pipeline, retrieval-contract | finite-diff (prerequisite) |
| Existing | retrieval-contract | q-retrieval-contract | — | rag-evaluation, tool-reliability | retrieval-metrics (application) |
| Existing | tool-reliability | q-tool-reliability | — | agent-evaluation | idempotency-ledger (application) |
| Existing | agent-evaluation | q-agent-evaluation | tool-reliability, reproducibility | tool-reliability, data-pipeline | trajectory-score (application) |
| Existing | data-pipeline | q-data-pipeline | reproducibility | reproducibility, attention-contract | accumulate-grads (prerequisite) |
| Existing | token-loss-contract | q-token-loss-contract | — | reproducibility | assistant-labels (application) |
| Existing | qlora-precision | q-qlora-precision | lora, mixed-precision | lora, mixed-precision | symmetric-quantize (application) |
| Existing | context-state | q-context-state | retrieval-contract, tool-reliability | retrieval-contract, tool-reliability | context-budget (application) |
| Existing | agent-permissions | q-agent-permissions | tool-reliability | tool-reliability | idempotency-ledger (prerequisite) |
| Existing | performance-diagnosis | q-performance-diagnosis | compute-budget, mixed-precision | compute-budget, mixed-precision | accumulate-grads (prerequisite) |
| Existing | reasoning-verifiers | q-reasoning-verifiers | sft-data, preference-data | sft-data, preference-data | trajectory-score (prerequisite) |
| New | moe-routing | q-moe-routing | attention-contract, mixed-precision | compute-budget, distributed-sharding | moe-budget (application) |
| New | mla-cache | q-mla-cache | gqa, rope | paged-attention, serving-goodput | mla-cache-budget (application) |
| New | distributed-sharding | q-distributed-sharding | gradient-accumulation, mixed-precision | data-pipeline, performance-diagnosis | accumulate-grads (prerequisite) |
| New | durable-agent-recovery | q-durable-agent-recovery | tool-reliability, context-state, agent-permissions | budgeted-agent-evals, computer-use-boundaries | recovery-plan (application) |
| New | budgeted-agent-evals | q-budgeted-agent-evals | agent-evaluation, paired-evaluation | durable-agent-recovery, adaptive-test-compute | trajectory-score (prerequisite) |
| New | verifier-robustness | q-verifier-robustness | reasoning-verifiers, paired-evaluation | computer-use-boundaries, training-data-lineage | trajectory-score (prerequisite) |
| New | quantized-serving | q-quantized-serving | mixed-precision, qlora-precision, kv-cache | moe-routing, serving-goodput | quantization-gate (application) |
| New | multimodal-grounding | q-multimodal-grounding | attention-contract, benchmark-validity | rag-evaluation, computer-use-boundaries | attention-head (prerequisite) |
| New | training-data-lineage | q-training-data-lineage | data-pipeline, benchmark-validity | sft-data, verifier-robustness | lineage-overlap (application) |
| New | serving-goodput | q-serving-goodput | continuous-batching, paged-attention, performance-diagnosis | quantized-serving, adaptive-test-compute | paired-outcomes (prerequisite) |
| New | computer-use-boundaries | q-computer-use-boundaries | agent-permissions, durable-agent-recovery | multimodal-grounding, verifier-robustness | idempotency-ledger (prerequisite) |
| New | adaptive-test-compute | q-adaptive-test-compute | speculative-decoding, paired-evaluation, budgeted-agent-evals | serving-goodput, verifier-robustness | paired-outcomes (prerequisite) |

## Primary sources for the expansion

Dates are publication or initial release dates unless noted (the FSDP tutorial uses a documentation revision date). Month-only sources retain the month supplied by the author. Engineering reports describe their documented systems; research observations are not production reliability guarantees. All sources below were checked on 2026-11-07.

| Published | Evidence | Source | Notes using it |
| --- | --- | --- | --- |
| 2019-10-04 | research | [ZeRO: Memory Optimizations Toward Training Trillion Parameter Models](https://arxiv.org/abs/1910.02054) | distributed-sharding |
| 2024-05-07 | research | [DeepSeek-V2 technical report](https://arxiv.org/abs/2405.04434) | mla-cache |
| 2024-08-06 | research | [Snell et al.: Scaling LLM test-time compute optimally](https://arxiv.org/abs/2408.03314) | adaptive-test-compute |
| 2024-12-27 | research | [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) | moe-routing |
| 2025-01-23 | release | [OpenAI: Operator system card](https://openai.com/index/operator-system-card/) | computer-use-boundaries |
| 2025-06-26 | research | [Hugging Face researchers: FineWeb2](https://arxiv.org/abs/2506.20920) | training-data-lineage |
| 2025-09-02 | documentation | [PyTorch FSDP2 tutorial (documentation revision)](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html) | distributed-sharding |
| 2025-11-26 | engineering | [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents) | durable-agent-recovery |
| 2026-01-09 | engineering | [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) | budgeted-agent-evals |
| 2026-01-29 | research | [METR: Time Horizon 1.1](https://metr.org/blog/2026-01-29-time-horizon-1-1/) | budgeted-agent-evals |
| 2026-02-03 | engineering | [Meta and NVIDIA: vLLM WideEP on Blackwell](https://vllm-project.github.io/2026/02/03/dsr1-gb200-part1.html) | moe-routing, quantized-serving, serving-goodput |
| 2026-02-12 | research | [Soft Contamination Means Benchmarks Test Shallow Generalization](https://arxiv.org/abs/2602.12413) | training-data-lineage |
| 2026-02-12 | release | [Google Deep Think team: Gemini 3 Deep Think update](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-deep-think/) | adaptive-test-compute |
| 2026-02-16 | release | [Qwen3.5-397B-A17B model card (initial release)](https://huggingface.co/Qwen/Qwen3.5-397B-A17B) | multimodal-grounding |
| 2026-02-16 | release | [Alibaba: Qwen3.5 release and native multimodality](https://home.alibabagroup.com/en-US/document-1960233590314762240) | multimodal-grounding |
| 2026-04-26 | research | [DeepSeek-V4 technical report](https://arxiv.org/abs/2606.19348) | mla-cache |
| 2026-07-23 | deployment | [DaoCloud: Serving GLM-5.2 with vLLM on B300 GPUs](https://vllm-project.github.io/2026/07/23/glm-5.2-nvfp4-b300-pd.html) | quantized-serving, serving-goodput |
| 2026-08 | research | [Anthropic: Training a Misaligned Reward Seeker](https://alignment.anthropic.com/2026/reward-seeker/) | verifier-robustness |
| 2026-09-25 | research | [OpenAI: Self-replicating prompt injections exist](https://alignment.openai.com/misalignment-reports/self-replicating-prompt-injections-exist) | computer-use-boundaries |
| 2026-10-09 | engineering | [Anthropic: Investigating unintended model actions in evaluations and internal use](https://www.anthropic.com/research/investigating-unintended-model-actions) | verifier-robustness |
| 2026-10-29 | engineering | [OpenAI: How we detect frontier model misalignment](https://alignment.openai.com/how-we-detect-frontier-model-misalignment) | verifier-robustness |
| 2026-11-03 | research | [OpenAI: Eval-production behavior gaps in agent safety](https://alignment.openai.com/eval-production-behavior-gap) | budgeted-agent-evals |

## Remaining gaps

- Profile FSDP/ZeRO and expert parallelism on real multi-host hardware with comparable workload and topology; browser arithmetic cannot validate collective implementations.
- Extend the MLA budget exercise to mixed attention, cache placement and measured bandwidth. Add multimodal localization and temporal grounding fixtures before claiming executable evidence.
- Build a sandboxed fault-injection harness with stale workers and provider mocks; the recovery drill verifies the decision contract only.
- Add a clustered repeated-run estimator, held-out calibration and adversarial verifier fixtures as standalone drills. No current score certifies deployment readiness.
- Compare serving choices and adaptive routing with real arrival traces, long-context quality slices and measured accelerator costs.

## Validation

Local verification on Windows with Node 24, Python with NumPy, and Chromium:

| Command | Result |
| --- | --- |
| `npm run validate:ascent` | Passed: 42 concepts, 11 lessons, 66 exercises, 34 reference solutions, 374 Python checks, and 150 seeded NumPy comparisons. |
| `npm run test:ascent` | Passed: 33 tests, including source metadata, prerequisite graph, path placement, exercise roles, and legacy progress handling. |
| `npm run verify` | Passed: lint, Astro type check (zero errors), 100 portfolio tests, Ascent tests and validator, static build/link check, and Wrangler Pages Functions build. |
| `npm run test:e2e -- --workers 4` | Passed: 36 across desktop and mobile; two existing mobile scenarios intentionally skip Python editor and full lesson/backup flows, which passed on desktop. |

The first full verification reached Node's heap limit during type checking in the working checkout, which held old generated Space bundles. The successful rerun excluded `artifacts/` from TypeScript scanning and used a 6 GiB heap ceiling. No production deployment or Space update was used for verification.
