---
title: "Q-SPECTRA"
summary: "Interactive browser labs for Rydberg RF sensing, quantum illumination radar, magnetic navigation, quantum circuits, and BB84 key distribution."
category: Robotics & Simulation
technologies: [Quantum Sensing, Quantum Circuits, BB84 QKD, SDR DSP, React, FastAPI, Unsloth QLoRA]
draft: false
status: In progress
sourceUrl: https://github.com/jacobhroutzong/q-spectra-17e-workbench
demoUrl: https://qspectra.jacobroutzong.dev/
---

## Explore the simulations

The public workbench runs in your browser without an account or API key. Compare simulated signals in the Rydberg RF, quantum illumination radar, and magnetic navigation labs. The theatre view brings the synthetic scenarios together in 3D.

In the Coding lab, build a circuit and compare the measured output with the expected distribution. In the Crypto lab, explore how basis choices and channel noise affect the BB84 error rate. Open the parameter glossary for definitions of the controls and metrics.

## Signal processing and model workflows

The browser includes an FFT-based SDR spectrum viewer and an offline co-pilot. The source includes a FastAPI bridge and optional scripts for teacher-model fine-tuning and student-model distillation. Live inference requires a separately configured backend or inference service.
