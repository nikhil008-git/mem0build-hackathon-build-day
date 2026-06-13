#!/usr/bin/env python3
"""
Hermes remediation worker for Rift.

Listens for failure context from apps/remediation and returns analysis + patch.

Usage (WSL):
  export OPENROUTER_API_KEY=...   # or ANTHROPIC_API_KEY / OPENAI_API_KEY
  export HERMES_MODEL=anthropic/claude-sonnet-4
  python3 packages/sdk-hermes/rift_remediation/server.py

Or: npm run hermes:worker
"""

from __future__ import annotations

import json
import os
import sys
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

# Allow running from repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rift_remediation.agent import analyze_failure  # noqa: E402

PORT = int(os.environ.get("HERMES_REMEDIATION_PORT", "8083"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[hermes-worker] {self.address_string()} - {fmt % args}")

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_error(404)
            return
        self._json(200, {"ok": True, "service": "rift-hermes-remediation"})

    def do_POST(self) -> None:
        if self.path != "/analyze":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            context = json.loads(body.decode("utf-8"))
            result = analyze_failure(context)
            self._json(200, {"ok": True, **result})
        except Exception as exc:
            traceback.print_exc()
            self._json(500, {"ok": False, "error": str(exc)})

    def _json(self, code: int, payload: dict[str, Any]) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"[hermes-worker] listening on http://localhost:{PORT}")
    print("[hermes-worker] POST /analyze  GET /health")
    server.serve_forever()


if __name__ == "__main__":
    main()
