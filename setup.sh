#!/usr/bin/env bash
# Sets up the Python venv in server/.venv — the exact path web/lib/mcpClient.ts
# auto-detects, so `npm run dev` always finds the right interpreter.
set -e

cd "$(dirname "$0")/server"
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip -q
./.venv/bin/pip install -r requirements.txt -q

echo ""
echo "Done. Verify it worked:"
echo "  server/.venv/bin/python -c \"import arxiv; print('arxiv OK')\""
echo ""
echo "Now run the frontend:"
echo "  cd web && npm install && npm run dev"
