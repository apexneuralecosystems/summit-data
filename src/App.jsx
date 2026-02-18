import { useState, useEffect, useCallback } from "react";
import SessionCard from "./SessionCard";
import "./App.css";

const API = "/api";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const limit = 12;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(API + "/sessions?" + params);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSessions(data.sessions);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleTranscriptUpdate = (sessionId, newTranscript) => {
    setSessions((prev) =>
      prev.map((s) =>
        (s._id === sessionId || s.website_index === sessionId)
          ? { ...s, transcript: newTranscript }
          : s
      )
    );
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="app">
      <header className="header">
        <h1>India AI Summit - Sessions</h1>
        <p className="subtitle">View and edit session transcripts</p>
        <div className="search-row">
          <input
            type="search"
            placeholder="Search by title, speakers, description"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
        </div>
      </header>

      <main className="main">
        {error && <div className="error-banner">{error}</div>}
        {loading && <div className="loading">Loading sessions</div>}
        {!loading && sessions.length === 0 && <div className="empty">No sessions found</div>}
        {!loading && sessions.length > 0 && (
          <>
            <div className="session-grid">
              {sessions.map((s) => (
                <SessionCard key={s._id} session={s} onTranscriptUpdate={handleTranscriptUpdate} />
              ))}
            </div>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn">Previous</button>
              <span className="page-info">Page {page} of {totalPages} ({total} sessions)</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn">Next</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
