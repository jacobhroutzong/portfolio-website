#!/usr/bin/env python3
"""Export replay data from the unchanged Fieldsense v1.1 Python models.

Usage: python tools/export_scenarios.py /path/to/isye-6501-agriculture
Requires the application's existing Python dependencies. No web server, network,
joblib deserialization, live sensor, or browser inference is involved.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import sys

PRESET_DETAILS = {
    "balanced": (
        "Balanced season",
        "Moderate rainfall chances and a shared water budget of 1,250 m³.",
    ),
    "dry_spell": (
        "Dry spell",
        "Hotter fields, 8% daily rain probability, and a 920 m³ water budget.",
    ),
    "strict_limit": (
        "Strict constraints",
        "All fields require full service, but the 650 m³ water budget is insufficient.",
    ),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_replay(record: dict) -> None:
    """Verify exported records reconcile with their inputs and farm totals."""
    result = record["result"]
    fields_in = record["input"]["fields"]
    if not result["feasible"]:
        assert result["simulation"] is None
        assert len(result["predictions"]) == 3
        return
    assert len(result["allocations"]) == len(fields_in) == 3
    for resource, capacity in record["input"]["resources"].items():
        assert result["totals"][resource] <= capacity + 1e-8
        assert math.isclose(
            result["totals"][resource] + result["remaining"][resource],
            capacity,
            abs_tol=1e-6,
        )
    for field in result["allocations"]:
        area = field["area_ha"]
        assert math.isclose(field["water_m3"], field["water_mm"] * area * 10)
        mdp_rain = [e["rain_mm"] for e in field["simulation"]["mdp"]["events"]]
        rule_rain = [e["rain_mm"] for e in field["simulation"]["rule"]["events"]]
        assert mdp_rain == rule_rain
        demand = field["simulation"]["crop_demand_mm_day"]
        for policy in ("mdp", "rule"):
            trial = field["simulation"][policy]
            events = trial["events"]
            assert [e["day"] for e in events] == list(range(1, 8))
            used = 0
            for event in events:
                action = event["irrigation_mm"]
                assert action in (0, 5, 10)
                used += action
                assert event["water_remaining_mm"] == field["water_mm"] - used
                assert event["water_remaining_mm"] >= 0
                expected = max(0, min(40, event["starting_moisture_mm"] + event["rain_mm"] + action - demand))
                assert math.isclose(event["ending_moisture_mm"], expected, abs_tol=0.011)
            assert trial["irrigation_mm"] == used
            assert math.isclose(trial["irrigation_m3"], used * area * 10, abs_tol=0.0051)
    for policy in ("mdp", "rule"):
        water = sum(f["simulation"][policy]["irrigation_m3"] for f in result["allocations"])
        unmet = sum(
            sum(e["unmet_demand_mm"] for e in f["simulation"][policy]["events"])
            * f["area_ha"] * 10
            for f in result["allocations"]
        )
        assert math.isclose(result["comparison"][f"{policy}_water_m3"], water, abs_tol=0.0051)
        assert math.isclose(result["comparison"][f"{policy}_unmet_m3"], unmet, abs_tol=0.00051)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Fieldsense v1.1 project directory")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "dist")
    args = parser.parse_args()
    source = args.source.resolve()
    source_files = [source / "src" / "agriculture" / name for name in (
        "api.py", "data.py", "mdp.py", "optimize.py", "predict.py"
    )]
    if not all(path.is_file() for path in source_files):
        parser.error("source must contain the Fieldsense v1.1 agriculture modules")
    sys.path.insert(0, str(source / "src"))

    from agriculture import api
    from agriculture.predict import fit_model

    # Regenerate from transparent seeded source. Do not read/write the original
    # serialized model or evaluation files and do not mutate the source package.
    trained = fit_model()
    api.model_and_metadata = lambda: trained
    records = {}
    for key, (label, description) in PRESET_DETAILS.items():
        inputs = copy.deepcopy(api.PRESETS[key])
        output = api.run_simulation(api.Scenario.model_validate(inputs))
        record = {
            "id": key,
            "label": label,
            "description": description,
            "input": inputs,
            "result": output,
        }
        validate_replay(record)
        records[key] = record

    payload = {
        "schema_version": 1,
        "provenance": {
            "source_version": "Fieldsense 1.1.0",
            "kind": "recorded_synthetic_model_outputs",
            "description": "Reproducible outputs from the original Random Forest → MILP → seven-day MDP Python pipeline. The web visualization replays these outputs; it does not run Python models or connect to real equipment.",
            "model_seed": 6501,
            "weather_seed": 41,
            "horizon_days": 7,
            "model_cache": "regenerated from source; original joblib not loaded or modified",
            "python": platform.python_version(),
            "dependencies": {name: importlib.metadata.version(name) for name in (
                "numpy", "pandas", "scipy", "scikit-learn", "joblib", "fastapi", "pydantic"
            )},
            "source_sha256": {str(path.relative_to(source)): sha256(path) for path in source_files},
            "controller": {
                "method": "finite-horizon dynamic programming with 5 mm moisture bins",
                "actions_mm": [0, 5, 10],
                "reward": "-4 * unmet_demand_mm - 0.08 * irrigation_mm",
                "q_values": "Expected cumulative artificial reward, rounded to four decimals. Higher is preferred; ties prefer less water. Policy lookup uses rounded 5 mm moisture bins; replay retains continuous water balance.",
                "rain_model": "Independent 0 or 6 mm daily rainfall with each field's constant rain_probability",
                "rule": "Apply 5 mm when starting moisture is below 10 mm and budget permits",
            },
            "units": {
                "depth": "mm", "area": "ha", "volume": "m³",
                "yield": "t/ha", "volume_conversion": "volume_m3 = depth_mm * area_ha * 10",
                "farm_unmet": "Area-weighted m³; do not sum field-level mm to report a farm-wide depth",
            },
        },
        "evaluation": trained[1],
        "scenarios": records,
    }
    # allow_nan=False prevents publishing invalid JSON numeric values.
    formatted = json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    compact = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    # Keep the JS fixture safe if copied inside an HTML script by a build tool.
    compact = compact.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "scenarios.json").write_text(formatted, encoding="utf8")
    (args.output / "scenarios.js").write_text(
        "/* Generated by tools/export_scenarios.py. Synthetic replay data, not live telemetry. */\n"
        + "window.FIELDSENSE_DATA = " + compact + ";\n", encoding="utf8"
    )
    print(json.dumps({
        "output": str(args.output.resolve()),
        "scenarios_sha256": sha256(args.output / "scenarios.json"),
        "evaluation": trained[1],
        "scenarios": {key: {"feasible": value["result"]["feasible"], "comparison": value["result"].get("comparison"), "allocation_water_m3": value["result"].get("totals", {}).get("water_m3")} for key, value in records.items()},
        "validation": "All exported replay invariants passed",
    }, indent=2))


if __name__ == "__main__":
    main()
