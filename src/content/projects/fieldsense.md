---
title: "Fieldsense"
summary: "An interactive sustainable-agriculture decision lab connecting synthetic crop-yield forecasts, constrained farm resource allocation, and seven-day irrigation planning."
category: "AI / Machine Learning"
technologies: ["Python", "scikit-learn", "SciPy", "Mixed-integer optimization", "Markov decision process", "FastAPI", "Astro"]
draft: false
unlisted: true
featured: false
status: Completed
order: 20
demoUrl: https://fieldsense.jacobroutzong.dev/
screenshots: []
videos: []
---

## Explore Fieldsense

[**Open the animated Fieldsense lab**](https://fieldsense.jacobroutzong.dev/) to replay a seven-day synthetic farm scenario, choose a field, inspect irrigation decisions, and compare the Markov decision process (MDP) with a rule-based controller. The visualization is a **recorded-output exhibit**; the browser does not run the Python models or control physical equipment.

This work began as a Georgia Tech ISYE 6501 sustainable-agriculture proposal completed in 2025. The original academic paper described an envisioned system; the November 2026 implementation turns its three-model idea into a reproducible **local Python decision-support demonstration**. These are different stages of the project, not evidence that the original proposal operated on an actual farm.

## Research question

How can predicted yield potential, limited water and other farm resources, and sequential irrigation decisions be combined in one interpretable workflow? The goal is to explain trade-offs—not to claim an independently validated increase in real crop yield or water savings.

## Implemented architecture

**Scenario inputs → Random Forest yield prediction → mixed-integer resource allocation → finite-horizon irrigation MDP → seven-day policy comparison.**

1. **Predict.** A scikit-learn Random Forest takes crop, synthetic seasonal weather, soil indicators, and prior yield. A time-ordered holdout prevents the latest fictional seasons from leaking into training. Its output is predicted yield in tonnes per hectare.
2. **Allocate.** SciPy mixed-integer optimization selects one resource bundle per field subject to shared water, fertilizer, labor, and equipment capacities. Predictions influence the allocation objective; assigned water becomes each field's irrigation cap. Strict full-service requirements can make an allocation infeasible.
3. **Irrigate.** A seven-day finite-horizon MDP selects 0, 5, or 10 mm irrigation actions before daily rain is realized. Soil-water storage, uncertain rain, crop demand, and the remaining field-level water cap determine its decisions.
4. **Compare.** The MDP and a simple moisture-threshold rule share the same deterministic weather paths and initial conditions. Results expose both irrigation volume and unmet crop-water demand. **One millimetre over one hectare equals 10 cubic metres**.

The Python/FastAPI app runs locally. The portfolio visualization is hosted as static Astro/JavaScript assets within the existing Cloudflare Pages site, with no new database, inference endpoint, cloud subscription, or equipment-control connection.

## Reproducible synthetic evaluation

The recorded November 2026 training run used **1,600 synthetic training records** and **320 held-out records**, with model seed 6501. Random Forest held-out MAE was **0.4704 t/ha**, compared with **1.4767 t/ha** for a training-mean baseline. These metrics establish behavior on generated examples, not predictive accuracy for real farms.

In the balanced seven-day fixture (weather seed 41), allocation assigned **1,140 m³** across three fields. The MDP applied **645 m³** of irrigation versus **945 m³** for the threshold rule, but incurred **45.72 m³** of area-weighted unmet crop-water demand versus **0 m³** for the rule. Water conservation alone is therefore **not** an unconditional improvement. The dry-spell scenario produced the same total irrigation and unmet demand under both policies, while the strict scenario correctly stopped before irrigation because its required allocation was infeasible.

These figures are simulations, **not field measurements**. The local v1.1 model/API test suite passed 10 tests, and the website replay has separate public-data invariants and browser coverage. The exact website replay data, model assumptions, and export are available in the interactive lab.

## November 2026 direction: evidence before hardware

The next scientific improvement would be **read-only, calibrated field data**, not an autonomous controller or additional foundation model. Potential inputs include soil volumetric water content, probe depth, timestamped weather, crop growth stage, and field boundaries. Sensor VWC cannot be treated directly as irrigation depth without representative root-zone and calibration assumptions.

A scientifically grounded crop-demand model could use **FAO-56 reference evapotranspiration and crop coefficients**, with appropriate weather/season data; NASA POWER and OpenET may help contextualize conditions, but satellite-derived actual ET is not a direct next-day irrigation forecast.

For machinery, vendor-authorized **read-only operation records** could be normalized using AgGateway ADAPT Standard 2.0 and relevant ISOBUS definitions where applicable; current John Deere export capabilities would need separate entitlement and format review. Imagery-based crop intelligence should be considered only if representative labeled images and a validated crop-specific task justify it. **No sensors, tractors, satellite feeds, or external equipment APIs are connected to Fieldsense today.**

The gateway to any real-field pilot is consented data, physical unit validation, sensor calibration, field/season-isolated evaluation, and operator safeguards. Autonomous actuation and equipment control remain out of scope.

## Cost and limitations

The original 2025 paper asserted approximately **$600/month** for a proposed AWS/Snowflake-oriented architecture without an itemized bill. It is **not a verified operating expense**, nor the cost of this implementation. The local demonstration incurs **$0 incremental cloud subscription cost**; hardware, electricity, development time, and existing shared portfolio hosting are excluded.

Limitations include synthetic training and weather, a simplified soil-water balance and crop-demand model, a seven-day horizon, only three modeled fields, and no real-world agronomic or economic validation. Fieldsense is a completed educational MVP with an open research direction—not an operational irrigation product.

**[Explore the animated field replay →](https://fieldsense.jacobroutzong.dev/)**
