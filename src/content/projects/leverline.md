---
title: Leverline
summary: A working-name demo of my applied-AI consulting business, with an interactive opportunity scan, ROI calculator, and a shared engine for offers and recommendations.
category: AI / Machine Learning
technologies: [Python, JavaScript, Jinja2, Business automation, Cloudflare Pages]
draft: false
featured: false
status: In progress
order: 3
demoUrl: https://jacobroutzong.dev/apps/leverline/
screenshots: []
videos: []
---

## Applied AI for everyday operations

Leverline is the working name for my applied-AI consulting and implementation business for US small and mid-sized businesses. This demo shows the website and browser tools. The business focuses on finding useful workflows, integrating them with existing systems, and measuring the outcome.

The initial offers focus on AI receptionists for home services and healthcare practices, plus private AI and document automation for law and accounting firms.

## Explore the app

[Open Leverline full screen](/apps/leverline/)

The standalone app includes the existing business website, a free AI Opportunity Scan, and an adjustable ROI calculator. The tools run in your browser. They use a shared catalog of use cases, industry signals, and pricing rather than a live language model. ROI outputs are estimates based on the inputs you provide; examples remain illustrative.

<iframe src="/apps/leverline/" title="Leverline business website, opportunity scan, and ROI calculator" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:1000px;border:1px solid var(--border);border-radius:8px;"></iframe>

## One business catalog across the tools

The implementation generates the website from YAML and Markdown. A Python engine handles opportunity ranking, readiness scoring, ROI calculations, quotes, and referral calculations. The browser tools mirror the Python engine, with automated parity checks.

The source repository also contains a lead API, a Gradio opportunity scanner, and an operating forecast. Those backend apps are separate from this browser application. The standalone site currently uses email for inquiries; it does not store leads in a deployed API.

The source repository and internal business documents remain private. No client results or testimonials are claimed here.
