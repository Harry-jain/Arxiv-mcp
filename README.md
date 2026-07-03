# arXiv Research MCP

A small MCP (Model Context Protocol) project:

- **`server/`** — a Python MCP server (FastMCP) exposing 3 tools backed by arXiv's free public API:
  `search_papers`, `add_to_reading_list`, `get_reading_list`
- **`web/`** — a Next.js frontend that spawns the Python server over stdio via the MCP TypeScript SDK
  and calls those tools directly from API routes.

No paid API keys or providers required — arXiv's API is free and open.

## How it flows

See [`docs/app-flow.mmd`](docs/app-flow.mmd) for a diagram of exactly what goes in and comes out
at each step (search, save, and reading-list load). Paste it into the [Mermaid Live Editor](https://mermaid.live)
or view it directly on GitHub, which renders `.mmd`/Mermaid code blocks natively.

```
Browser  →  Next.js page.tsx
              → /api/search        → MCP client → search_papers tool       → arXiv API
              → /api/reading-list  → MCP client → add/get_reading_list     → reading_list.json
```

The Next.js API routes spawn `server/main.py` as a subprocess over stdio (standard MCP transport)
and call its tools directly — no LLM required for this basic version, since it's just demonstrating
the MCP tool-calling loop end to end. You can later wire an LLM (e.g. Claude) into `/api/search` to
summarize results instead of just listing them.

## Why this exists

Searching arXiv usually means opening a browser tab, typing a query into their site, and manually
copy-pasting anything worth remembering into a notes app. This collapses that into one small tool:
search and saving happen in the same place, and the "save" step is a real action an AI agent (or you)
can trigger without leaving the conversation.

It's also a template for the MCP pattern itself. Swap `search_papers` for a different free API — GitHub
repos, RSS feeds, a local SQLite database — and the rest of the plumbing (stdio transport, Next.js API
routes calling `callTool`, a reading-list-style JSON store) barely changes. If you're learning MCP,
this is a complete but small enough example to read end to end in one sitting.

## Who it helps

- **Students / researchers** who want a lightweight, self-hosted way to search papers and keep a running
  list without signing up for another SaaS tool or paying for one.
- **Anyone building with MCP** who wants a working, minimal reference: one Python server, three tools,
  one frontend calling them over stdio — no framework magic hiding what's actually happening.
- **AI agent builders** — because the tools are exposed over MCP, any MCP-compatible client (Claude
  Desktop, Claude Code, a custom agent) can call `search_papers` and `add_to_reading_list` directly,
  not just this Next.js frontend.

### Quickest path
```bash
./setup.sh          # creates server/.venv and installs requirements there
cd web && npm install && npm run dev
```
`web/lib/mcpClient.ts` auto-detects `server/.venv` — no `PYTHON_BIN` needed if you use `setup.sh`.

### Manual setup

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

## Troubleshooting: "No module named 'arxiv'"

This means the Python process spawned by Next.js isn't the same interpreter you ran
`pip install -r requirements.txt` in. `npm run dev` doesn't inherit an activated venv from
another terminal — it spawns `python3` fresh from PATH.

Fix: either run `./setup.sh` (creates the venv exactly where `mcpClient.ts` looks for it,
`server/.venv`), or set `PYTHON_BIN` in `web/.env.local` to the full path of the venv's
python binary. Restart `npm run dev` after either change.

## Next steps (if you want to extend it)
- Swap `reading_list.json` for SQLite once you want persistence across environments
- Add a `summarize_paper` tool that fetches the PDF and summarizes it
- Wire `/api/search` through the Anthropic API with `mcp_servers` so an LLM can reason over results
  instead of just listing them
