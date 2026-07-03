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

export default function Home() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [readingList, setReadingList] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxResults: 5 }),
      });
      const data = await res.json();
      setPapers(data.papers ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(paper: Paper) {
    await fetch("/api/reading-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: paper.id, title: paper.title }),
    });
    loadReadingList();
  }

  const savedIds = new Set(readingList.map((p) => p.id));

  return (
    <main>
      <h1>arXiv Research MCP</h1>
      <p className="subtitle">
        Search papers and save them to a reading list — backed by an MCP server calling arXiv&apos;s free API.
      </p>

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. federated learning edge computing"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <section>
        <h2>Results</h2>
        {papers.length === 0 && <p className="empty">No results yet — try a search above.</p>}
        {papers.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.title}</h3>
            <div className="meta">
              {p.authors.slice(0, 3).join(", ")}
              {p.authors.length > 3 ? " et al." : ""} · {p.published?.slice(0, 10)}
            </div>
            <p>{p.summary}...</p>
            <div className="actions">
              {p.pdf_url && (
                <a href={p.pdf_url} target="_blank" rel="noreferrer" style={{ marginRight: "0.6rem" }}>
                  PDF ↗
                </a>
              )}
              <button
                className="secondary"
                disabled={savedIds.has(p.id)}
                onClick={() => handleAdd(p)}
              >
                {savedIds.has(p.id) ? "Saved" : "Add to reading list"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Reading List ({readingList.length})</h2>
        {readingList.length === 0 && <p className="empty">Nothing saved yet.</p>}
        {readingList.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.title}</h3>
            {p.note && <p>{p.note}</p>}
          </div>
        ))}
      </section>
    </main>
  );
}
