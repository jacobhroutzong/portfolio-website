---
title: Convergence
summary: A private CRM and operations workspace that connects sales pipelines, contact history, projects, tasks, and automation.
category: Business & Operations Systems
technologies: [Next.js, TypeScript, PostgreSQL, Cloudflare Workers, Cloudflare Containers, Supabase]
draft: false
featured: true
status: Completed
order: 2
screenshots:
  - src: /media/convergence-workspace.png
    alt: Convergence home with shortcuts to the pipeline, contacts, and tasks above a workspace briefing
    caption: The workspace home brings together the pipeline, upcoming work, and recent activity. Captured from the released application using fictional demo records.
    example: true
  - src: /media/convergence-pipeline.png
    alt: Convergence deal board with fictional deals arranged in sales stages
    caption: The deal board groups opportunities by stage and links each card to its record and activity history. All deals shown are fictional.
    example: true
  - src: /media/convergence-tasks.png
    alt: Convergence task list grouped by due date with priorities and linked records
    caption: Tasks connect follow-up work to deals, contacts, or projects. All records shown are fictional.
    example: true
---

## Owner-only demo

**[Open the owner-only demo ↗](https://convergence-staging.jacobroutzong.workers.dev/)**

Cloudflare Access restricts the working application to the owner’s allowlisted identity. The screenshots below show the released application with fictional records.

## From a lead to delivery

Convergence keeps a sales relationship and the work it creates in one workspace. Teams can qualify leads, keep contacts and companies with their activity histories, move deals through configurable pipelines, and organize follow-up in projects and task boards. Home highlights the pipeline, overdue work, and recent activity. Analytics summarize the same workspace records.

## Isolation, automation, and recovery

Workspaces share a PostgreSQL schema with row-level security and tenant-scoped relationships. The server checks workspace membership and role permissions, and the application database role is subject to RLS. The automation role has separate queue permissions.

A transactional outbox records business events for the automation worker. Cloudflare runs the catch-up job before the nightly reset. The reset checks that the database holds only the disposable demo workspace and its seeded accounts before rebuilding it.

## Private staging architecture

Cloudflare Access gates a Worker that routes requests to the Next.js web container and wakes the automation container when needed. Those containers stop after inactivity. A separate scheduled Worker runs the reset container. Supabase Free provides the isolated PostgreSQL database over verified TLS.

## What was verified

The private release passed hosted desktop and mobile checks, member-permission tests, and tenant isolation checks. Staging applied 42 migrations and verified RLS on 56 tenant tables. A logical backup restored all 64 application tables with matching counts and policies. The scheduled reset invalidated old sessions and restored the fictional workspace. Local verification passed 126 unit tests and 319 integration tests.

## Demo limits

The workspace resets daily and uses fictional records. Public registration, outbound email and webhooks, uploads, AI, and Stripe are disabled in staging. The project is a working portfolio demonstration of CRM and operations workflows.
