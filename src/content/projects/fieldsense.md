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

Fieldsense traces that chain. It began as a Georgia Tech ISYE 6501 course project in **2025** and was rebuilt in **November 2026** as a local, executable Python demonstration. [**Open the animated Fieldsense lab**](https://fieldsense.jacobroutzong.dev/)

## From the original paper

<div class="fs-paper-passage">
  <p>The proposal gave the allocator a whole-farm decision. It would choose a bundle for each field while sharing a limited pool of resources.</p>
  <figure>
    <blockquote>“To best allocate resources, we will implement Mixed-Integer Linear Programming, a model well suited for allocation problems.”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 2, Models Defining · 2025</cite></figcaption>
  </figure>
</div>

<div class="fs-paper-passage">
  <p>The irrigation model addressed a different timescale. Each field would use its assigned water over a week of uncertain weather.</p>
  <figure>
    <blockquote>“We will use Markov Chain Decision Process to prescribe optimal irrigation actions (when/where and how much to water) using probabilistic models of weather and soil states.”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 2, Models Defining · 2025</cite></figcaption>
  </figure>
</div>

These are **verbatim excerpts from the original 2025 submission**. They describe intended methods, not independently verified agricultural deployments. The original report also discussed sensors and a larger AWS/Snowflake stack; those integrations are not part of the current working demonstration.

## The executable system

**Random Forest → mixed-integer allocation → finite-horizon irrigation policy.** One model's output is the next model's input.

1. **Forecast.** A Random Forest predicts yield in tonnes per hectare from synthetic crop, weather, soil and prior-yield data. The latest two fictional seasons are held out during training, rather than mixed randomly across the dataset.
2. **Allocate.** A SciPy MILP chooses a resource bundle per field under shared water, fertilizer, labor and equipment constraints. Forecast yield affects the allocation score; the assigned water becomes a hard irrigation cap.
3. **Decide.** A seven-day Markov decision process chooses among 0, 5 and 10 mm of irrigation with finite-horizon planning, a simplified soil-water balance and uncertain rainfall. Its comparison policy waters 5 mm whenever starting soil-water storage is below 10 mm and the budget allows it.

<div class="fs-paper-passage">
  <p>The proposed forecast inputs included weather observations. In the working 2026 demonstration, the comparable inputs are generated synthetically, not pulled from a NOAA station or field sensor.</p>
  <figure>
    <blockquote>“Weather data; temperature, rainfall, and humidity. These correlations capture impact on yields.”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 3, Input Data · 2025</cite></figcaption>
  </figure>
</div>

The Python app is local. The browser exhibit is **not running inference**: it replays published, seeded outputs from that pipeline. The site does not receive live sensor readings or send commands to irrigation equipment.

## Reading the parameters

The parameters have three different roles. **Inputs** describe the scenario (crop, weather, soil and resources); **decisions** are the chosen resource bundles and daily irrigation; **outcomes** report water used, remaining soil storage, unmet crop demand and illustrative yield scores. Changing the day or policy selects a different *recorded replay*, rather than recalculating the original Python models.

**Worked field example:** In East Acre on balanced-scenario MDP day 1, starting water is 7 mm, irrigation is 5 mm, rain is 6 mm, and modeled crop demand is 5.06 mm. The resulting ending storage is **12.94 mm**: `7 + 5 + 6 − 5.06 = 12.94`. On day 2, irrigation is **0 mm** but rainfall is still **6 mm**, leaving **13.88 mm** ending storage. The exact values are displayed in the lab's inspector.

| Term | What it means here |
| --- | --- |
| **Scenario / weather seed** | A recorded set of synthetic budget and rainfall assumptions; the seed lets the weather path be replayed consistently. |
| **Predicted yield (t/ha)** | The Random Forest estimate of crop output per hectare; it influences the resource allocation score. |
| **Bundle / water cap** | The optimizer's illustrative resource choice for each field and the resulting seven-day irrigation limit. |
| **MDP / threshold rule** | A policy that considers future outcomes versus a simpler policy that irrigates 5 mm when starting soil-water storage falls below 10 mm, if budget allows. |
| **Soil-water storage / crop demand** | Modeled water remaining in the soil and the crop's illustrative daily requirement, both expressed as depths in mm. |
| **Water used / unmet demand** | Irrigation volume versus modeled crop-water shortfall. Both are shown in m³ so the trade-off stays visible. |
| **Rain probability / realized rain** | A probability used to choose irrigation *before* rain occurs versus the actual rain value in that recorded synthetic day. |
| **Water depth (mm) / water volume (m³)** | Depth is what the sprinkler applies over a field; volume also depends on area. `volume = depth × hectares × 10`. |
| **Day / replay speed** | Chooses a recorded day / changes the playback rate; neither retrains a model. |
| **Decision score (MDP)** | Estimated future reward for each permitted watering action. Higher is preferred; these scores are not probabilities, revenue estimates, or observed harvests. |
| **Scored harvest** | Predicted yield × field area × an illustrative resource-bundle factor; it is an optimization score, not a measured harvest. |
| **MAE / baseline MAE** | Average absolute yield-prediction error on held-out synthetic data versus predicting the training mean. Neither is field-validated accuracy. |

The [interactive lab](https://fieldsense.jacobroutzong.dev/) also has expandable guides beside the field inspector and budget ledger. Units matter: **1 mm over 1 hectare = 10 m³**.

## What the runs actually show

The synthetic training run used 1,600 training records and 320 held-out records (model seed 6501). Held-out Random Forest MAE was **0.4704 t/ha**, compared with **1.4767 t/ha** for a training-mean baseline. This is a test of generated data, not a real-field accuracy estimate.

In the balanced seven-day scenario (weather seed 41), the optimizer assigned **1,140 m³** across three fields. The MDP used **645 m³** for irrigation versus **945 m³** for the threshold rule. But the MDP also left **45.72 m³** of area-weighted unmet crop-water demand, compared with **0 m³** under the rule. Saving water and satisfying demand are different objectives. The dry-spell scenario tied on both measures; the strict full-service scenario stopped at an infeasible allocation instead of inventing a plan.

All results are reproducible **synthetic simulations**. Water depth is converted using 1 mm over 1 ha = 10 m³. The interface keeps water use and unmet demand side by side rather than presenting a single unqualified "savings" number.

<div class="fs-paper-passage">
  <p>The paper also described the types of crop records that a real deployment would need. The current synthetic implementation does not claim access to planting records or seed-variety measurements.</p>
  <figure>
    <blockquote>“Crop data; crop type, seed variety, planting date. This defines crop-specific yield potential.”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 3, Input Data · 2025</cite></figcaption>
  </figure>
</div>

## How the original proposal was intended to save money

The paper's economic argument had **three separate mechanisms**, which should not be conflated with results from the current demonstration.

1. **Use inputs more selectively.** Better crop-yield estimates could help avoid excess water, fertilizer, pesticide, labor and equipment allocation. The 2026 Python model demonstrates an allocation decision, but does not assign actual dollar prices to those resources.
2. **Use less irrigation where a policy permits.** The synthetic balanced-week comparison shows 945 m³ of irrigation under the rule versus 645 m³ under the MDP—**300 m³ less**. It simultaneously shows **45.72 m³ more unmet crop-water demand**. Any real financial conclusion would need local water and pumping costs, crop prices, and yield impacts; none are measured here.
3. **Choose a cheaper operating stack.** The 2025 paper discussed open-source visualization and smaller server instances. It included estimates and savings claims but **no itemized bill or verified before/after operating costs**.

<div class="fs-paper-passage">
  <p>The proposal explicitly treated resource price as a model input. A real financial optimizer would need validated local prices, which the current synthetic allocation score does not use.</p>
  <figure>
    <blockquote>“Resource Cost (how much does each resource cost)”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 3, Input Data · 2025 · proposed data requirement</cite></figcaption>
  </figure>
</div>

<div class="fs-paper-passage">
  <p>The paper compared a proposed Metabase deployment with Tableau, reporting a $650/month software saving. That figure was an assumption in the coursework, not a measured Fieldsense cost reduction.</p>
  <figure>
    <blockquote>“Cheaper than Tableau, saves 650$ a month”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 3, Model Deployment · 2025 · unverified comparison</cite></figcaption>
  </figure>
</div>

<div class="fs-paper-passage">
  <p>The conclusion described an approximately $600/month stack. Because no detailed AWS, Snowflake, licensing, hardware or labor breakdown was provided, this cannot be treated as a validated production budget.</p>
  <figure>
    <blockquote>“Technologies considered throughout the stack were prioritized by cost savings, and I was able to bring the entire cost of the stack down to around 600$/month.”</blockquote>
    <figcaption><cite>ISYE 6501 · Part 4, Report of Analytics Model · 2025 · unverified estimate</cite></figcaption>
  </figure>
</div>

The paper also referenced the third-party Phyt’Eau example, reporting “40% less water usage, 30% higher productivity, and 25% lower costs.” Those are **figures recounted in the original coursework**, not independently verified Fieldsense measurements. The current replay uses synthetic data and does not support claims of a 40% water saving or a 25% cost reduction.

The proposal additionally described a feedback loop:

> “MDP feeds water usage back to MLP for reallocation.” — *ISYE 6501, Part 3, Model Deployment (2025)*.

That was a proposed future reallocation loop. The current seven-day browser replay uses a precomputed field allocation; it does not continuously reoptimize resources during playback.

## What changed from the 2025 proposal

The original paper outlined an ingestion and deployment stack involving sensors, Airflow, AWS, Snowflake, dbt, Redis and irrigation controllers. It also stated a roughly **$600/month** cost, but included no itemized bill. Neither deployment nor that expense has independent verification. The 2026 local model adds **no incremental cloud subscription cost**; existing hosting, computing, electricity, development and hardware are excluded.

The next worthwhile step is not another model. It is a small **read-only data pilot**: calibrated soil moisture, station weather, timestamps, crop stage and field area. FAO-56 evapotranspiration could replace illustrative crop demand after validation; machinery exports (for example ADAPT/ISOBUS-compatible records) may follow if available and authorized. Computer vision should wait for real labeled imagery and a defined task. No equipment actuation or autonomous control is planned.

The current system is an educational decision lab, not an operational agricultural recommendation engine. [**Open Fieldsense →**](https://fieldsense.jacobroutzong.dev/)
