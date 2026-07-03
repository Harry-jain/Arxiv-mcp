"use client";

import { useEffect, useState } from "react";

type Paper = {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string | null;
  pdf_url?: string;
};

type ReadingItem = {
  id: string;
  title: string;
  note: string;
};

function shortId(id: string) {
  // arXiv entry_id looks like http://arxiv.org/abs/2406.01234v1 — show just the id.
  const match = id.match(/abs\/(.+)$/);
  return match ? match[1] : id;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readingList, setReadingList] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function loadReadingList() {
    const res = await fetch("/api/reading-list");
    const data = await res.json();
    setReadingList(data.papers ?? []);
  }

  useEffect(() => {
    loadReadingList();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxResults: 6 }),
      });
      const data = await res.json();
      setPapers(data.papers ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(paper: Paper) {
    setAddingId(paper.id);
    try {
      await fetch("/api/reading-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paper.id, title: paper.title }),
      });
      await loadReadingList();
    } finally {
      setAddingId(null);
    }
  }

  const savedIds = new Set(readingList.map((p) => p.id));

  return (
    <main>
      <header className="masthead">
        <div className="eyebrow">MCP · arXiv · local reading list</div>
        <h1>
          Find the paper. <em>Keep it.</em>
        </h1>
        <p className="subtitle">
          A small research tool backed by an MCP server — every search and save goes through a
          tool call, not a database wrapper.
        </p>
      </header>

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="federated learning, edge computing, RAG evaluation…"
          autoFocus
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <section>
        <h2>
          Results
          {papers.length > 0 && <span className="count">{papers.length}</span>}
        </h2>
        {!hasSearched && (
          <p className="empty">Start with a topic — results pull live from arXiv's API.</p>
        )}
        {hasSearched && !loading && papers.length === 0 && (
          <p className="empty">No matches. Try broader terms.</p>
        )}
        {papers.map((p, i) => (
          <div className="card" key={p.id} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="meta">
              {shortId(p.id)} · {p.published?.slice(0, 10)}
            </div>
            <h3>{p.title}</h3>
            <p>
              {p.authors.slice(0, 3).join(", ")}
              {p.authors.length > 3 ? ", et al." : ""}
            </p>
            <p>{p.summary}…</p>
            <div className="actions">
              {p.pdf_url && (
                <a href={p.pdf_url} target="_blank" rel="noreferrer">
                  PDF ↗
                </a>
              )}
              <button
                className="secondary"
                disabled={savedIds.has(p.id) || addingId === p.id}
                onClick={() => handleAdd(p)}
              >
                {savedIds.has(p.id) ? "Saved" : addingId === p.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>
          Reading list
          {readingList.length > 0 && <span className="count">{readingList.length}</span>}
        </h2>
        {readingList.length === 0 && <p className="empty">Nothing saved yet.</p>}
        {readingList.map((p, i) => (
          <div className="card" key={p.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="meta">{shortId(p.id)}</div>
            <h3>{p.title}</h3>
            {p.note && <p>{p.note}</p>}
          </div>
        ))}
      </section>
    </main>
  );
}
