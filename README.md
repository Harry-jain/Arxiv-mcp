# arXiv Research MCP

A small MCP (Model Context Protocol) project:

- **`server/`** — a Python MCP server (FastMCP) exposing 3 tools backed by arXiv's free public API:
  `search_papers`, `add_to_reading_list`, `get_reading_list`
- **`web/`** — a Next.js frontend that spawns the Python server over stdio via the MCP TypeScript SDK
  and calls those tools directly from API routes.

No paid API keys or providers required — arXiv's API is free and open.

## How it works

```
Browser  →  Next.js page.tsx
              → /api/search        → MCP client → search_papers tool       → arXiv API
              → /api/reading-list  → MCP client → add/get_reading_list     → reading_list.json
```

The Next.js API routes spawn `server/main.py` as a subprocess over stdio (standard MCP transport)
and call its tools directly — no LLM required for this basic version, since it's just demonstrating
the MCP tool-calling loop end to end. You can later wire an LLM (e.g. Claude) into `/api/search` to
summarize results instead of just listing them.

## Setup

### 1. Python MCP server
```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Next.js frontend
```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 — search arXiv, add results to your reading list, done.

If your Python binary isn't `python3` on PATH, set `PYTHON_BIN` in `web/.env.local`:
```
PYTHON_BIN=/full/path/to/venv/bin/python
```

## Next steps (if you want to extend it)
- Swap `reading_list.json` for SQLite once you want persistence across environments
- Add a `summarize_paper` tool that fetches the PDF and summarizes it
- Wire `/api/search` through the Anthropic API with `mcp_servers` so an LLM can reason over results
  instead of just listing them
