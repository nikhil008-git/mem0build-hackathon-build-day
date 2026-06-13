"""
Rift observability plugin for Nous Research Hermes Agent.

Install:
  pip install requests
  copy this folder to ~/.hermes/plugins/rift/

Hermes will call register(ctx) at startup and forward agent lifecycle
events to the Rift ingest API.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import requests

RIFT_API_KEY = os.environ.get("RIFT_API_KEY", "rift_test_demo_key")
RIFT_PROJECT_ID = os.environ.get("RIFT_PROJECT_ID", "demo")
RIFT_ENDPOINT = os.environ.get("RIFT_ENDPOINT", "http://localhost:8081")
RIFT_ENV = os.environ.get("RIFT_ENVIRONMENT", "development")

_state: dict[str, Any] = {"events": [], "run_id": None}


def _evt(event_type: str, data: dict, span_id: str | None = None) -> None:
    run_id = _state.get("run_id")
    if not run_id:
        return

    envelope = {
        "version": "1.0",
        "type": event_type,
        "id": f"evt_{uuid.uuid4().hex[:16]}",
        "runId": run_id,
        "projectId": RIFT_PROJECT_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": RIFT_ENV,
        "sdk": {"name": "rift-hermes-plugin", "version": "0.0.1"},
        "data": data,
    }
    if span_id:
        envelope["spanId"] = span_id

    _state["events"].append(envelope)


def _flush() -> None:
    events = _state.get("events", [])
    if not events:
        return

    try:
        res = requests.post(
            f"{RIFT_ENDPOINT}/v1/events",
            headers={
                "Authorization": f"Bearer {RIFT_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"events": events},
            timeout=10,
        )
        res.raise_for_status()
        _state["events"] = []
    except Exception as exc:
        print(f"[rift-hermes] flush failed: {exc}")


def register(ctx) -> None:
    def on_session_start(**kwargs):
        _state["run_id"] = f"run_{uuid.uuid4().hex[:16]}"
        _state["events"] = []
        _state["started_at"] = datetime.now(timezone.utc)
        message = kwargs.get("message") or kwargs.get("user_message") or ""
        _evt("run.started", {
            "input": {"message": message},
            "metadata": {
                "agent": "hermes",
                "framework": "hermes",
                "model": os.environ.get("HERMES_MODEL", "unknown"),
            },
        })

    def on_session_end(**kwargs):
        status = "success"
        error = None
        if kwargs.get("error"):
            status = "error"
            error = {
                "type": "agent_error",
                "message": str(kwargs.get("error")),
            }

        started = _state.get("started_at")
        duration_ms = 0
        if started:
            duration_ms = int(
                (datetime.now(timezone.utc) - started).total_seconds() * 1000
            )

        _evt("run.ended", {
            "status": status,
            "output": kwargs.get("response"),
            "error": error,
            "durationMs": duration_ms,
        })
        _flush()
        _state["run_id"] = None

    def pre_tool_call(tool_name=None, params=None, **kwargs):
        span_id = f"span_{uuid.uuid4().hex[:8]}"
        _state["last_span"] = span_id
        _evt("tool.input", {
            "spanId": span_id,
            "toolName": tool_name,
            "arguments": params or {},
        }, span_id=span_id)

    def post_tool_call(tool_name=None, params=None, result=None, **kwargs):
        span_id = _state.get("last_span")
        _evt("tool.output", {
            "spanId": span_id,
            "toolName": tool_name,
            "result": result,
            "latencyMs": kwargs.get("latency_ms", 0),
        }, span_id=span_id)

    ctx.register_hook("on_session_start", on_session_start)
    ctx.register_hook("on_session_end", on_session_end)
    ctx.register_hook("pre_tool_call", pre_tool_call)
    ctx.register_hook("post_tool_call", post_tool_call)

    print("[rift-hermes] plugin registered — telemetry → Rift ingest API")
