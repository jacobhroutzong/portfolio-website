---
title: "Q-SPECTRA // 17E Quantum CEMA & EMS Workbench"
summary: "Contested-EMS quantum sensing simulator for Rydberg RF, quantum illumination radar, and cold-atom magnetic navigation, with a Qwen 3.8 27B → OLMo 7B distillation workflow."
category: Signal Processing / Electronic Warfare
technologies: [Quantum Sensing, Electronic Warfare (17E), Unsloth QLoRA, Qwen 27B, OLMo 7B, FastAPI, React, SDR DSP]
draft: false
status: In progress
sourceUrl: https://github.com/jacobhroutzong/q-spectra-17e-workbench
demoUrl: https://qspectra.jacobroutzong.dev
---

## Explore the simulation

The public workbench runs in your browser without an account or API key. Change the inputs in the Rydberg RF, quantum illumination radar, and magnetic navigation labs to see how the simulated signals respond. The theatre view brings the synthetic scenarios together in 3D.

## Signal processing and model workflows

The browser includes an FFT-based SDR spectrum viewer and an offline co-pilot. The source includes a FastAPI bridge and optional scripts for teacher-model fine-tuning and student-model distillation. Live inference requires a separately configured backend or inference service.

The lab outputs come from simulated scenarios. The frontend test suite checks 11 physics and signal-processing cases.
