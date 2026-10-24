---
title: Ascent
emoji: 🌄
colorFrom: green
colorTo: gray
sdk: static
app_file: dist/index.html
app_build_command: >-
  python3 -c "import urllib.request,zipfile,io,pathlib; z=zipfile.ZipFile(io.BytesIO(urllib.request.urlopen('https://codeload.github.com/jacobhroutzong/portfolio-website/zip/refs/heads/codex/ascent-ai-lab-prep').read())); z.extractall('download'); next(pathlib.Path('download').iterdir()).rename('source')" && cd source && npm ci && npm run build && node tools/space-entry.mjs && mv dist ../dist
fullWidth: true
short_description: Advanced AI knowledge and research engineering practice
---

# Ascent

An intermediate/advanced AI knowledge workspace by Jacob Routzong: 24 connected technical references, 24 original interview questions, four study paths, and 20 executable Python problems.

[GitHub source](https://github.com/jacobhroutzong/portfolio-website/tree/codex/ascent-ai-lab-prep) · [Portfolio](https://jacobroutzong.dev)

Search concepts, explain mechanisms before revealing rubrics, keep technical notes, and schedule retrieval reviews. Python runs in disposable browser workers. Progress stays in your browser, with JSON export/import. The first Python execution needs a runtime download. Static practice tests are inspectable. Scores are self-assessments, not hiring predictions. PyTorch and server model inference are not included.

This free Static Space builds from the public GitHub branch when its configuration is updated. There are no API keys, model inference charges, or analytics. Portfolio production deployment is separate.

