import { useState } from "react";
import "./SessionCard.css";

const API = "/api";

export default function SessionCard({ session, onTranscriptUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [transcript, setTranscript] = useState(session.transcript ?? "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const id = session._id ?? session.website_index;

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`${API}/sessions/${id}/transcript`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onTranscriptUpdate(id, updated.transcript);
      setSaveStatus("Saved");
      setEditMode(false);
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      setSaveStatus("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTranscript(session.transcript ?? "");
    setEditMode(false);
    setSaveStatus(null);
  };

  const hasTranscript = (session.transcript ?? "").trim().length > 0;

  return (
    <div className={`session-card ${expanded ? "expanded" : ""}`}>
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <span className="index">#{session.website_index}</span>
        <h3 className="title">{session.title}</h3>
        <span className="meta">
          {session.date} - {session.time}
        </span>
        {hasTranscript && <span className="badge">Transcript</span>}
        <span className="chevron">{expanded ? "v" : ">"}</span>
      </div>

      {expanded && (
        <div className="card-body">
          <div className="field">
            <label>Speakers</label>
            <p>{session.speakers || "-"}</p>
          </div>
          <div className="field">
            <label>Venue</label>
            <p>{session.venue || "-"}</p>
          </div>
          <div className="field">
            <label>Description</label>
            <p className="description">{session.description || "-"}</p>
          </div>
          {session.watch_live_link && session.watch_live_link !== "Don't have" && (
            <div className="field">
              <a href={session.watch_live_link} target="_blank" rel="noreferrer" className="watch-link">
                Watch Live
              </a>
            </div>
          )}

          <div className="transcript-section">
            <div className="transcript-header">
              <label>Transcript</label>
              {!editMode ? (
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              ) : (
                <div className="transcript-actions">
                  <button
                    type="button"
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving" : "Save"}
                  </button>
                  <button type="button" className="btn-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editMode ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Add or edit transcription here"
                className="transcript-input"
                rows={8}
              />
            ) : (
              <div className="transcript-display">
                {(session.transcript ?? "").trim() || (
                  <span className="transcript-placeholder">No transcript yet. Click Edit to add.</span>
                )}
              </div>
            )}
            {saveStatus && (
              <span className={`save-status ${saveStatus.startsWith("Error") ? "error" : ""}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
