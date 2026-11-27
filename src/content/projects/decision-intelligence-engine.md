---
title: "Decision"
summary: "An archived engineering workbench for inspecting how a system turns telemetry into a decision."
category: "AI / Machine Learning"
technologies: ["Python", "TypeScript"]
draft: false
status: Completed
screenshots:
  - src: /media/showcase/decision-intelligence-engine.svg
    alt: "Decision review: Telemetry input, then Evaluation, then Human review."
    caption: "Public illustration of the workflow."
    example: true
---

## Design

The workbench separates input validation, evaluation, and the final review. A reviewer can inspect the evidence and see where uncertainty calls for a manual decision. Illustrative domains include robotics, aviation, navigation and compute systems.


## Research archive

The hosted evaluator is retired. The illustration shows the workflow. The source preserves the scenario inputs, typed choice, risk and severity questions, and confidence gates for human review.

[Public source and scenario code](https://github.com/jacobhroutzong/decision-intelligence-engine)

### Run locally

Clone the public repository and use Python 3.12 in a virtual environment. Install the dependencies and start the workbench on loopback:

```sh
python -m pip install "gradio==5.20.0" -r requirements.txt
python -c "from app import demo; demo.launch(server_name='127.0.0.1', server_port=7860)"
```

Open `http://127.0.0.1:7860` to inspect the interface and scenario controls. Model evaluation uses OpenRouter with Liquid AI's `liquid/d1-ultra` and requires your own credentials. Evaluations may incur provider charges.
