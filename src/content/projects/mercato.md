---
title: "Mercato"
summary: "A private business operations platform connecting ecommerce product research, sourcing, inventory, finance, and CreatorOS content workflows."
category: "Business & Operations Systems"
technologies: ["TypeScript", "Cloudflare Workers", "D1", "R2"]
draft: false
status: In progress
---

## Overview

Mercato brings two business workflows into one private workspace:

- **Commerce:** Product discovery and scoring, supplier evidence, quote and landed-cost scenarios, development decisions, purchasing, receiving, inventory, sales, and financial reconciliation.
- **CreatorOS:** Content ideas, story variants, production tasks, approvals, calendar planning, manual publishing records, performance observations, and partnership tracking.

## Architecture and privacy

The application uses a dedicated Cloudflare Worker, D1 database, private R2 attachments, and owner-only Cloudflare Access. Research imports preserve their original evidence independently of owner decisions and operational transactions.

## Release status

The private production hostname is configured, but owner sign-in and end-to-end hosted workflows have not yet been verified. Automated read-only synchronization with the original Commerce and CreatorOS Google Sheets also remains pending Google service-account configuration and live refresh tests.

This is a public project overview, not a link into the private administrative interface.
