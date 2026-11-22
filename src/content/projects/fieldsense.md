---
title: "Fieldsense"
summary: "Yield forecasting, constrained allocation and a seven-day irrigation controller, rebuilt from a Georgia Tech agriculture project as a reproducible simulation."
category: "AI / Machine Learning"
technologies: ["Python", "scikit-learn", "SciPy", "MILP", "Markov decision process", "FastAPI", "Astro"]
draft: false
unlisted: true
featured: false
status: Completed
order: 20
demoUrl: https://fieldsense.jacobroutzong.dev/
screenshots: []
videos: []
---

## The question

A yield forecast is useful, but it is not a farm plan. The more interesting problem is what happens next: how to divide scarce water, fertilizer, equipment and labor across fields, then decide how much to irrigate when tomorrow's rain is uncertain.

Fieldsense traces that chain. It began as a Georgia Tech ISYE 6501 course project in **2025** and was rebuilt in **November 2026** as a local, executable Python demonstration. [**Explore the animated field replay →**](https://fieldsense.jacobroutzong.dev/)

## From the original paper

The proposal named three analytics methods, not three unrelated dashboards. In *Part 2 (Models Defining)*, I wrote:

> “To best allocate resources, we will implement Mixed-Integer Linear Programming, a model well suited for allocation problems.”

The same section describes the irrigation component:

> “We will use Markov Chain Decision Process to prescribe optimal irrigation actions (when/where and how much to water) using probabilistic models of weather and soil states.”

These are **verbatim excerpts from the original 2025 submission**. They describe intended methods, not independently verified agricultural deployments. The original report also discussed sensors and a larger AWS/Snowflake stack; those integrations are not part of the current working demonstration.

## The executable system

**Random Forest → mixed-integer allocation → finite-horizon irrigation policy.** One model's output is the next model's input.

1. **Forecast.** A Random Forest predicts yield in tonnes per hectare from synthetic crop, weather, soil and prior-yield data. The latest two fictional seasons are held out during training, rather than mixed randomly across the dataset.
2. **Allocate.** A SciPy MILP chooses a resource bundle per field under shared water, fertilizer, labor and equipment constraints. Forecast yield affects the allocation score; the assigned water becomes a hard irrigation cap.
3. **Decide.** A seven-day Markov decision process chooses among 0, 5 and 10 mm of irrigation with finite-horizon planning, a simplified soil-water balance and uncertain rainfall. Its comparison policy waters 5 mm whenever starting soil-water storage is below 10 mm and the budget allows it.

The Python app is local. The browser exhibit is **not running inference**: it replays published, seeded outputs from that pipeline. The site does not receive live sensor readings or send commands to irrigation equipment.

## What the runs actually show

The synthetic training run used 1,600 training records and 320 held-out records (model seed 6501). Held-out Random Forest MAE was **0.4704 t/ha**, compared with **1.4767 t/ha** for a training-mean baseline. This is a test of generated data, not a real-field accuracy estimate.

In the balanced seven-day scenario (weather seed 41), the optimizer assigned **1,140 m³** across three fields. The MDP used **645 m³** for irrigation versus **945 m³** for the threshold rule. But the MDP also left **45.72 m³** of area-weighted unmet crop-water demand, compared with **0 m³** under the rule. Saving water and satisfying demand are different objectives. The dry-spell scenario tied on both measures; the strict full-service scenario stopped at an infeasible allocation instead of inventing a plan.

All results are reproducible **synthetic simulations**. Water depth is converted using 1 mm over 1 ha = 10 m³. The interface keeps water use and unmet demand side by side rather than presenting a single unqualified "savings" number.

## What changed from the 2025 proposal

The original paper outlined an ingestion and deployment stack involving sensors, Airflow, AWS, Snowflake, dbt, Redis and irrigation controllers. It also stated a roughly **$600/month** cost, but included no itemized bill. Neither deployment nor that expense has independent verification. The 2026 local model adds **no incremental cloud subscription cost**; existing hosting, computing, electricity, development and hardware are excluded.

The next worthwhile step is not another model. It is a small **read-only data pilot**: calibrated soil moisture, station weather, timestamps, crop stage and field area. FAO-56 evapotranspiration could replace illustrative crop demand after validation; machinery exports (for example ADAPT/ISOBUS-compatible records) may follow if available and authorized. Computer vision should wait for real labeled imagery and a defined task. No equipment actuation or autonomous control is planned.

The current system is an educational decision lab, not an operational agricultural recommendation engine. [**Open Fieldsense →**](https://fieldsense.jacobroutzong.dev/)
