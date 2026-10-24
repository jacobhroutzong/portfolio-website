---
title: "Ascent — AI Lab Preparation"
summary: "An advanced AI knowledge and interview workspace with connected references, original Python problems, and spaced retrieval."
category: "AI / Machine Learning"
technologies: ["TypeScript", "Astro", "Pyodide", "Monaco", "IndexedDB"]
draft: false
featured: false
status: In progress
order: 5
sourceUrl: "https://github.com/jacobhroutzong/portfolio-website"
demoUrl: "https://huggingface.co/spaces/jacobroutzong/ascent"
screenshots:
  - src: "/media/ascent-dashboard.png"
    alt: "Ascent advanced AI workspace with knowledge references, interview retrieval, and coding practice."
    caption: "The advanced workspace at 1440 pixels. Progress is saved locally."
videos: []
---

## Project overview

Ascent is an AI knowledge database and interview workspace for intermediate Python and ML practitioners. Its six domains connect architecture, inference, training, post-training, evaluation, and applied systems through mechanisms, equations, worked examples, and original interview prompts.

[Open Ascent](/ascent/) · [Hugging Face Space](https://huggingface.co/spaces/jacobroutzong/ascent).

## What runs

The current slice contains 24 sourced technical references, 24 original interview questions, four study paths, 20 original Python problems, and 66 optional foundation exercises. Explain a mechanism before revealing its rubric, keep technical notes, bookmark concepts, and schedule retrieval reviews. Python executes in disposable browser workers, and a time limit terminates stuck runs. Monaco provides the desktop editor. Progress stays in IndexedDB, with JSON export and import.

## Architecture

The application shares this portfolio's Astro static build, design tokens, and Cloudflare Pages deployment. Lessons and problem metadata are validated data files. A Runner interface keeps execution separate from the learning interface.

## Practical limits

This is a learning tool, not a hiring predictor. The remaining curriculum tracks are outlines. Static hidden checks are inspectable practice checks; trusted assessments would need a remote sandbox. Full PyTorch execution and half-day interview loops are future work. The first Python run requires an internet connection.
