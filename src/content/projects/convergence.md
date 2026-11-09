---
title: "Convergence"
summary: "A CRM and operations workspace that connects customer relationships with work in progress."
category: "Business & Operations Systems"
technologies: ["TypeScript", "PostgreSQL"]
draft: false
status: In progress
screenshots:
  - src: /media/showcase/convergence.svg
    alt: "Operations workspace: Customer activity, then Deal workspace, then Team follow-up."
    caption: "Public illustration of the workflow."
    example: true
---

## Design

A workspace groups related contacts, deals, and tasks. Permissions apply at the workspace boundary; background jobs and integration actions are kept separate from the interactive application.

The private Operations workspace has a separate backup integration. [Read its privacy notice](/projects/convergence/backup-privacy/).
