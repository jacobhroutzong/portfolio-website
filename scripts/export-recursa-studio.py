"""Export the public Recursa replay as a static portfolio page.

Usage: python scripts/export-recursa-studio.py RECURSA_CHECKOUT EMPTY_OUTPUT_DIR
The committed snapshot lives in public/projects/recursa/studio/.
"""

import argparse
from base64 import b64encode
from hashlib import sha256
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import re
import sys
from threading import Thread
from urllib.request import urlopen


def export(source, output):
    sys.path.insert(0, str(source))
    from recursa.server import make_handler

    if output.exists() and any(output.iterdir()):
        raise ValueError("Export to an empty directory so old recordings cannot carry over.")
    output.mkdir(parents=True, exist_ok=True)

    with ThreadingHTTPServer(("127.0.0.1", 0), make_handler(source / "traces/public")) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()

        def read(route):
            with urlopen(f"http://127.0.0.1:{server.server_port}{route}", timeout=5) as response:
                return response.read()

        def save(relative, contents):
            target = output / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(contents)

        try:
            page = read("/").decode("utf-8").replace("\r\n", "\n")
            for anchor in ("overview", "benchmarks"):
                page = page.replace(f'data-view="{anchor}"', f'id="{anchor}" data-view="{anchor}"', 1)
            page = page.replace("/assets/", "./assets/")
            page = re.sub(r"/api/([a-z-]+)(?=['\"])", r"./api/\1.json", page)
            page = page.replace("'/api/runs/'+encodeURIComponent(", "'./api/runs/'+encodeURIComponent(")
            page, dynamic_routes = re.subn(r"('\./api/runs/'\+encodeURIComponent\([a-z.]+\))", r"\1+'.json'", page)
            if dynamic_routes != 2 or re.search(r"(?<!\.)/api/", page):
                raise ValueError("Review the Studio's replay URLs before exporting this revision.")
            scripts = re.findall(r"<script>(.*?)</script>", page, re.DOTALL)
            hashes = " ".join(f"'sha256-{b64encode(sha256(script.encode()).digest()).decode()}'" for script in scripts)
            policy = (f"default-src 'self'; script-src {hashes}; style-src 'self' 'unsafe-inline'; "
                      "object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'")
            page = page.replace("</head>", f'<meta http-equiv="Content-Security-Policy" content="{policy}">\n</head>', 1)
            # The policy must precede the inline script and any fetched resources.
            save("index.html", page.encode())

            for name in ("runs", "benchmark-traces", "playground", "progress", "security-checks",
                         "task-comparison", "comparison-series", "repair-series", "expanded-comparison-series"):
                save(f"api/{name}.json", read(f"/api/{name}"))
            runs = json.loads((output / "api/runs.json").read_bytes())
            traces = json.loads((output / "api/benchmark-traces.json").read_bytes())["traces"]
            for entry in runs + traces:
                identifier = entry["id"]
                if not re.fullmatch(r"[a-zA-Z0-9_-]+", identifier):
                    raise ValueError(f"Invalid replay ID: {identifier}")
                save(f"api/runs/{identifier}.json", read(f"/api/runs/{identifier}"))
            for name in ("task-preview", "generated-task-preview", "generated-operations-preview", "generated-aviation-preview"):
                save(f"assets/{name}.png", read(f"/assets/{name}.png"))
            for name in ("task", "operations", "aviation"):
                folder = f"assets/{name}-replay"
                manifest = read(f"/{folder}/manifest.json")
                save(f"{folder}/manifest.json", manifest)
                for chapter in json.loads(manifest)["chapters"]:
                    for frame in chapter["frames"]:
                        filename = frame["file"]
                        if not re.fullmatch(r"[a-z-]+-\d{1,2}\.png", filename):
                            raise ValueError(f"Invalid replay frame: {filename}")
                        save(f"{folder}/{filename}", read(f"/{folder}/{filename}"))
            for name in ("LICENSE", "NOTICE"):
                save(f"{name}.txt", (source / name).read_bytes())
        finally:
            server.shutdown()
            worker.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    export(args.source.resolve(), args.output.resolve())
