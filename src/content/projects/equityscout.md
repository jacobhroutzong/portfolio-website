---
title: EquityScout
summary: A private real estate acquisition research workstation with deterministic underwriting, source verification, and refinance stress scenarios.
category: Quantitative Research
technologies: [Python, SQLite, Decimal, Data provenance, Financial modeling]
draft: false
featured: false
order: 1
status: In progress
screenshots:
  - src: /media/equityscout-desktop.png
    alt: EquityScout acquisition dashboard displaying an explicitly synthetic QA property
    caption: Local workstation tested using an invented property. This is not a real listing or a verified investment opportunity.
    example: true
---

[Open the interactive calculator →](/apps/equityscout/)

## Research with a paper trail

EquityScout combines property research with transparent acquisition, renovation,
rental, and refinancing calculations. It separates estimated values from verified
renovated sold comparables and proposed rent from approved voucher contract rent.

The public calculator uses an invented scenario. It runs entirely in your browser,
with no property search, private database access, or paid provider calls.

## Working local implementation

- Decimal underwriting, algebraic purchase-cost ceilings, and cash-basis accounting.
- LTV, DSCR, cashflow-target and seasoning checks for refinance scenarios.
- Closed renovated sale review with documented exclusions.
- Audited parcel merging that preserves analyst-reviewed data.
- Manual PHA schedule versions, rehabilitation scopes, and downside cases.
- Local single-owner authentication and 54 passing automated tests.

## Private data stays private

The full research workstation currently runs locally. It is not exposed through
this portfolio. Managed production authentication, storage integration, live data
validation and private deployment remain in progress. The screenshots and browser
calculator contain synthetic examples only. No genuine lead or credential is
published here, and no live-source coverage or investment outcome is claimed.
