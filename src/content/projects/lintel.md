---
title: Lintel
summary: A smart-home installation business preview with a home scan, room-by-room planner, package estimates and savings calculator.
category: Data Engineering
technologies: [Python, JavaScript, Jinja2, YAML, Cloudflare Pages]
draft: false
featured: false
status: In progress
order: 3
demoUrl: https://jacobroutzong.dev/apps/lintel/
screenshots: []
videos: []
---

## Smart-home installation, planned room by room

Lintel is my smart-home design, installation and support business in development for north metro Atlanta and north Georgia, with selected southside appointments. This preview brings the website and browser tools together while I prepare the business for launch.

## Explore the app

[Open Lintel full screen](/apps/lintel/)

Try the Smart Home Scan, build a room-by-room plan, compare packages or change the inputs in the savings calculator. Prices are planning estimates. Dollar savings and time saved are shown separately, and examples remain illustrative. Travel, installation availability and final pricing are confirmed before booking.

<iframe src="/apps/lintel/" title="Lintel smart-home website, home scan, planner and savings calculator" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;height:1000px;border:1px solid var(--border);border-radius:8px;"></iframe>

## One catalog across the tools

The site is generated from YAML and Markdown. A Python engine calculates quotes, compatibility, savings, scan recommendations and room plans. Automated parity checks keep the browser calculations aligned with that engine.

The source repository also contains a separate lead API, a photo-based planner and an operating forecast. Those backend applications are not deployed as part of this preview. Inquiries use email; submitting the form prepares the details to send rather than storing a lead in an online database.

The source code and internal business documents remain private. This preview makes no claim of completed client installations or verified client results. Lintel currently lives on this portfolio; a dedicated domain can replace the app address later.
