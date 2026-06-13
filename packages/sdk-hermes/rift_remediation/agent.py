"""Analyze agent failures with Hermes AIAgent or OpenRouter fallback."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

SYSTEM_PROMPT = """You are Rift's remediation agent. Analyze AI agent run failures and produce code fixes.

Respond with ONLY valid JSON (no markdown fences, no extra text):
{
  "analysis": "Markdown root cause explanation with ## Root Cause and ## Suggested Fix sections",
  "patch": "Unified diff (--- a/path +++ b/path format). Minimal fix only.",
  "pr_title": "fix: short imperative title",
  "confidence": "high" | "medium" | "low"
}
"""


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        return json.loads(fenced.group(1).strip())

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])

    raise ValueError("LLM response did not contain valid JSON")


def _build_prompt(context: dict[str, Any]) -> str:
    lines = [
        "Analyze this failed agent run and generate a fix.",
        "",
        f"Run ID: {context.get('runId')}",
        f"Agent: {context.get('agentName') or 'unknown'}",
        f"Framework: {context.get('framework') or 'unknown'}",
        f"Model: {context.get('model') or 'unknown'}",
        f"Error type: {context.get('errorType') or 'unknown'}",
        f"Error message: {context.get('errorMsg') or 'none'}",
        "",
        "Input:",
        json.dumps(context.get("input"), indent=2, default=str),
        "",
        "Output:",
        json.dumps(context.get("output"), indent=2, default=str),
        "",
        "Event trace:",
    ]

    for event in context.get("events", []):
        lines.append(f"- [{event.get('type')}] {json.dumps(event.get('data'), default=str)[:500]}")

    repo = os.environ.get("GITHUB_REPO")
    if repo:
        lines.extend(["", f"Target repository: {repo}"])

    return "\n".join(lines)


def _parse_result(raw: str, context: dict[str, Any]) -> dict[str, str]:
    parsed = _extract_json(raw)
    return {
        "analysis": str(parsed.get("analysis", raw)),
        "patch": str(parsed.get("patch", "")),
        "pr_title": str(parsed.get("pr_title", f"fix: remediate {context.get('runId')}")),
        "confidence": str(parsed.get("confidence", "medium")),
        "engine": "unknown",
    }


def _analyze_with_openrouter(prompt: str, model: str) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "No LLM available. Set OPENROUTER_API_KEY, or install Hermes: "
            "npm run hermes:setup"
        )

    resolved_model = model or os.environ.get("HERMES_MODEL") or "anthropic/claude-sonnet-4"

    payload = json.dumps(
        {
            "model": resolved_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Rift Remediation",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            body = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter error ({exc.code}): {detail}") from exc

    return body["choices"][0]["message"]["content"]


def _analyze_with_hermes(prompt: str, model: str) -> str:
    from run_agent import AIAgent  # type: ignore

    agent = AIAgent(
        model=model,
        quiet_mode=True,
        skip_context_files=True,
        skip_memory=True,
        disabled_toolsets=["terminal", "browser", "web"],
        max_iterations=15,
        ephemeral_system_prompt=SYSTEM_PROMPT,
    )
    return agent.chat(prompt)


def analyze_failure(context: dict[str, Any]) -> dict[str, str]:
    prompt = _build_prompt(context)
    model = os.environ.get("HERMES_MODEL", "")

    # Prefer full Hermes AIAgent when installed in the active Python env
    try:
        raw = _analyze_with_hermes(prompt, model)
        result = _parse_result(raw, context)
        result["engine"] = "hermes"
        print("[hermes-worker] analyzed via Hermes AIAgent")
        return result
    except ImportError:
        print("[hermes-worker] Hermes not installed — using OpenRouter fallback")

    raw = _analyze_with_openrouter(prompt, model)
    result = _parse_result(raw, context)
    result["engine"] = "openrouter"
    print("[hermes-worker] analyzed via OpenRouter")
    return result
