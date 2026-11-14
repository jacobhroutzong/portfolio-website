---
title: "Rigor"
summary: "A private interview-preparation workspace that turns 11 learning tracks into a daily practice plan."
category: "AI / Machine Learning"
technologies: ["React", "TypeScript", "Cloudflare Workers", "Cloudflare D1"]
draft: false
status: Completed
---

[Open Rigor](https://rigor.jacobroutzong.dev/) · The application requires owner authorization through Cloudflare Access.

## Daily practice

Rigor brings together 11 tracks spanning algorithms, SQL, applied machine learning, GPU programming, data engineering, quantum computing, security, and quantitative reasoning. The tracks use Deep-ML, StrataScratch, Interview Query, LeetGPU, TensorTonic, Data Vidhya, PennyLane and IBM Quantum (one combined track), TryHackMe, MyntBit, QuantVault, and LeetCode.

Each day starts with three priority recommendations and one activity per enabled track. The scheduler checks prerequisites before suggesting work, carries unfinished activities forward, and keeps the plan stable across reloads. Activities link to the original providers.

## Progress and architecture

The React and TypeScript dashboard records completions, notes, feedback, and learning history. Progress bars show how much of each track's selected curriculum is complete.

A Cloudflare Worker serves the dashboard and API. Cloudflare D1 stores daily plans, progress, and preferences so they persist across sessions. Cloudflare Access restricts the application to its owner.
