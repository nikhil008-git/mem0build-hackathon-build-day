#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Setting up Hermes Python env in packages/sdk-hermes/.venv ..."
python3 -m venv .venv
.venv/bin/pip install -U pip
.venv/bin/pip install -r requirements.txt
echo ""
echo "Done. Start worker with: npm run hermes:worker"
