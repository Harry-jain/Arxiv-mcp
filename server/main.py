"""
Minimal MCP server for arXiv research.

Exposes 3 tools over stdio using the official MCP Python SDK:
  - search_papers        : query arXiv's free public API
  - add_to_reading_list   : save a paper to a local JSON file
  - get_reading_list      : return everything saved so far

No paid API keys required. arXiv's API is free and open.
"""

import json
import os
from typing import List, Dict

import arxiv
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("arxiv-research")

# Reading list is stored next to this file as a flat JSON array.
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
LIST_FILE = os.path.join(DATA_DIR, "reading_list.json")


def _load_list() -> List[Dict]:
    if not os.path.exists(LIST_FILE):
        return []
    with open(LIST_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_list(data: List[Dict]) -> None:
    with open(LIST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@mcp.tool()
def search_papers(query: str, max_results: int = 5) -> List[Dict]:
    """Search arXiv for papers matching a query string.

    Args:
        query: free-text search query, e.g. "federated learning edge computing"
        max_results: how many results to return (default 5)
    """
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
    )
    results = []
    for r in client.results(search):
        results.append(
            {
                "id": r.entry_id,
                "title": r.title.strip(),
                "summary": r.summary.strip()[:400],
                "authors": [a.name for a in r.authors],
                "published": r.published.isoformat() if r.published else None,
                "pdf_url": r.pdf_url,
            }
        )
    return results


@mcp.tool()
def add_to_reading_list(paper_id: str, title: str, note: str = "") -> str:
    """Save a paper to the local reading list.

    Args:
        paper_id: the arXiv entry id (from search_papers results)
        title: paper title
        note: optional personal note about why you're saving it
    """
    data = _load_list()
    if any(item["id"] == paper_id for item in data):
        return f"Already in reading list: {title}"
    data.append({"id": paper_id, "title": title, "note": note})
    _save_list(data)
    return f"Added: {title}"


@mcp.tool()
def get_reading_list() -> List[Dict]:
    """Return every paper currently saved in the reading list."""
    return _load_list()


if __name__ == "__main__":
    mcp.run(transport="stdio")
