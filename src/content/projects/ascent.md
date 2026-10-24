---
title: "Ascent — AI Lab Preparation"
summary: "A local-first learning workspace with original exercises, browser-based Python practice, spaced review, and transparent progress tracking."
category: "AI / Machine Learning"
technologies: ["TypeScript", "Astro", "Pyodide", "Monaco", "IndexedDB"]
draft: false
featured: false
status: In progress
order: 5
sourceUrl: "https://github.com/jacobhroutzong/portfolio-website"
demoUrl: "https://jacobroutzong.dev/ascent/"
screenshots:
  - src: "/media/ascent-dashboard.png"
    alt: "Ascent overview with a learning plan, daily XP goal, and 13-track mastery radar in the portfolio's cream and green theme."
    caption: "The initial local workspace at 1440 pixels. Progress starts empty and is earned through practice."
videos: []
---

## Project overview

Ascent is a personal learning workspace for developing programming, mathematical, and machine-learning foundations through retrieval and original coding exercises.

[Open Ascent](/ascent/).

## What runs

The first curriculum slice contains 66 exercises and 15 original Python problems. Python executes in disposable browser workers, and a time limit terminates stuck runs. Monaco provides the desktop editor. Progress stays in IndexedDB, with JSON export and import.

## Architecture

The application shares this portfolio's Astro static build, design tokens, and Cloudflare Pages deployment. Lessons and problem metadata are validated data files. A Runner interface keeps execution separate from the learning interface.

## Practical limits

This is a learning tool, not a hiring predictor. The remaining curriculum tracks are outlines. Static hidden checks are inspectable practice checks; trusted assessments would need a remote sandbox. Full PyTorch execution and half-day interview loops are future work. The first Python run requires an internet connection.
