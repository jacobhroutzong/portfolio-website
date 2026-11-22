---
title: Muster
summary: "A public workspace for researching Army and Air National Guard Active Guard Reserve announcements."
category: Business & Operations Systems
technologies: [JavaScript, CSS, Cloudflare Workers]
draft: false
status: Completed
---

[Open Muster](https://muster.jacobroutzong.dev/) · No sign-in required.

## Finding relevant announcements

Muster brings state-published Active Guard Reserve (AGR) announcements into one workspace. I can narrow the results by Army or Air National Guard, state, eligible applicant grade, and military specialty. Army MOS and AOC codes and Air Force Specialty Codes stay distinct. I can sort announcements by posted or opening date, then check the closing date and eligibility wording against the original source.

## The November 21, 2026 snapshot

The snapshot contains **313 AGR announcement records from 33 states**, with **123 Army** and **190 Air** records. The source registry covers all 50 states and shows where access or extraction remained unresolved in the other 17. Those gaps leave vacancy counts unknown. Some announcements cover standing applicant pools, and readers should check the original announcement for current status.

Each record keeps the source links, posted or opening date, closing date, and research check date distinct. Missing dates and uncertain status remain visible, and the workspace distinguishes AGR announcements from other categories of Guard employment such as ADOS and technician positions.

## Browser-local workspace

The app serves the reviewed snapshot as a static page. Bookmarks and imported snapshots stay in the browser. The workspace supports filtered CSV exports and restoring the original snapshot.
