"""
Serve the Social Media Guide from this folder over HTTP so fetch() works
(opening the HTML as file:// blocks loading recommendations.json).

Usage (from this directory):
  python serve.py

Then open in your browser:
  http://127.0.0.1:8765/social-media-recommender.html

POST /api/log-result — JSON body appended to post_results_log.json (same schema as run_pipeline.py).
"""

from __future__ import annotations

import json
import os
import threading
import webbrowser
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
RESULTS_LOG = os.path.join(ROOT, "post_results_log.json")
HOST = "127.0.0.1"
PORT_RANGE = range(8765, 8785)


def _append_results_log(entry: dict) -> None:
    entry = dict(entry)
    entry["logged_at"] = datetime.now().isoformat(timespec="seconds")
    entry["source"] = "real"
    log: list = []
    if os.path.exists(RESULTS_LOG):
        try:
            with open(RESULTS_LOG, encoding="utf-8") as f:
                log = json.load(f)
        except (json.JSONDecodeError, OSError):
            log = []
    if not isinstance(log, list):
        log = []
    log.append(entry)
    with open(RESULTS_LOG, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False)


class GuideHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        print(f"[serve] {self.address_string()} - {format % args}")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        if urlparse(self.path).path == "/api/log-result":
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_POST(self):
        if urlparse(self.path).path != "/api/log-result":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            entry = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":false,"error":"invalid json"}')
            return
        if not isinstance(entry, dict):
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":false,"error":"body must be a JSON object"}')
            return
        try:
            _append_results_log(entry)
        except OSError as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode())
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')


def main():
    os.chdir(ROOT)
    if not os.path.exists(RESULTS_LOG):
        with open(RESULTS_LOG, "w", encoding="utf-8") as f:
            json.dump([], f)

    httpd = None
    port = None
    for candidate in PORT_RANGE:
        try:
            httpd = HTTPServer((HOST, candidate), GuideHandler)
            port = candidate
            break
        except OSError:
            continue
    if httpd is None:
        raise RuntimeError(f"No free port in {list(PORT_RANGE)}")

    url = f"http://{HOST}:{port}/social-media-recommender.html"
    print(f"[serve] Serving {ROOT}", flush=True)
    print(f"[serve] Open: {url}", flush=True)
    print("[serve] Ctrl+C to stop", flush=True)

    def _open_browser():
        try:
            webbrowser.open(url)
        except OSError:
            pass

    threading.Timer(0.5, _open_browser).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[serve] Stopped", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    main()
