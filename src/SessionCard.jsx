import { useState, useMemo } from "react";
import "./SessionCard.css";

const API = "/api";

/** Parse speakers string into list of "Name, Org" or "Name" */
function parseList(str) {
  if (!str || typeof str !== "string") return [];
  return str
    .split(/\s*;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Get YouTube video ID from various URL forms */
function getYoutubeId(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    if (u.hostname.replace("www.", "") === "youtube.com") {
      return u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop() || null;
    }
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
  } catch (_) {}
  return null;
}

/** Build Google Calendar "Add event" URL */
function addToCalendarUrl(session) {
  const text = encodeURIComponent(session.title || "Session");
  const dateStr = session.date || ""; // e.g. "16 Feb 2026"
  const timeStr = (session.time || "").split("-")[0].trim() || "9:00"; // e.g. "9:30 AM"
  const details = encodeURIComponent(
    [session.venue, session.room, session.speakers, session.description].filter(Boolean).join("\n\n")
  );
  const location = encodeURIComponent([session.venue, session.room].filter(Boolean).join(", "));
  let dates = "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dates = `${y}${m}${day}T090000/${y}${m}${day}T100000`;
    }
  } catch (_) {}
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    details: details || text,
    location,
  });
  if (dates) params.set("dates", dates);
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

const DESC_PREVIEW_LEN = 280;

const defaultPeople = (p) =>
  Array.isArray(p) ? p.map((x) => ({ name: String(x.name ?? ""), linkedin_url: String(x.linkedin_url ?? "") })) : [];

export default function SessionCard({ session, onTranscriptUpdate, onPeopleUpdate }) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [transcript, setTranscript] = useState(session.transcript ?? "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [people, setPeople] = useState(() => defaultPeople(session.people));
  const [savingPeople, setSavingPeople] = useState(false);
  const [peopleSaveStatus, setPeopleSaveStatus] = useState(null);

  const id = session._id ?? session.website_index;
  const speakersList = useMemo(() => parseList(session.speakers), [session.speakers]);
  const partnersList = useMemo(() => parseList(session.knowledge_partners), [session.knowledge_partners]);
  const watchUrl = session.watch_live_link && session.watch_live_link !== "Don't have" ? session.watch_live_link : null;
  const youtubeId = watchUrl ? getYoutubeId(watchUrl) : null;
  const description = session.description || "";
  const showReadMore = description.length > DESC_PREVIEW_LEN;
  const descriptionText = descriptionExpanded ? description : description.slice(0, DESC_PREVIEW_LEN) + (showReadMore ? "..." : "");

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

  const addPerson = () => setPeople((prev) => [...prev, { name: "", linkedin_url: "" }]);
  const removePerson = (index) => setPeople((prev) => prev.filter((_, i) => i !== index));
  const updatePerson = (index, field, value) =>
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const handleSavePeople = async () => {
    setSavingPeople(true);
    setPeopleSaveStatus(null);
    try {
      const res = await fetch(`${API}/sessions/${id}/people`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onPeopleUpdate?.(id, updated.people);
      setPeopleSaveStatus("Saved");
      setTimeout(() => setPeopleSaveStatus(null), 2000);
    } catch (e) {
      setPeopleSaveStatus("Error: " + e.message);
    } finally {
      setSavingPeople(false);
    }
  };

  const hasTranscript = (session.transcript ?? "").trim().length > 0;

  return (
    <article className="session-card session-card--design">
      <div className="session-card__top">
        <h2 className="session-card__title">{session.title}</h2>
        <div className="session-card__actions">
          <a
            href={addToCalendarUrl(session)}
            target="_blank"
            rel="noreferrer"
            className="btn-calendar"
            aria-label="Add to Calendar"
          >
            <span className="btn-calendar__icon" aria-hidden>📅</span>
            Add to Calendar
          </a>
          {watchUrl && (
            <a href={watchUrl} target="_blank" rel="noreferrer" className="btn-watch">
              <span className="btn-watch__icon" aria-hidden>▶</span>
              Watch Live
            </a>
          )}
        </div>
      </div>

      <div className="session-card__meta">
        {session.date && (
          <span className="session-card__meta-item">
            <span className="session-card__meta-icon" aria-hidden>📅</span>
            {session.date}
          </span>
        )}
        {session.time && (
          <span className="session-card__meta-item">
            <span className="session-card__meta-icon" aria-hidden>🕐</span>
            {session.time}
          </span>
        )}
        {session.venue && (
          <span className="session-card__meta-item">
            <span className="session-card__meta-icon" aria-hidden>📍</span>
            {session.venue}
          </span>
        )}
        {session.room && (
          <span className="session-card__meta-item">
            <span className="session-card__meta-icon" aria-hidden>🏢</span>
            {session.room}
          </span>
        )}
      </div>

      {speakersList.length > 0 && (
        <section className="session-card__block">
          <h3 className="session-card__label">Speakers</h3>
          <div className="session-card__tags session-card__tags--scroll">
            {speakersList.map((s, i) => (
              <span key={i} className="session-card__tag">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="session-card__block">
        <h3 className="session-card__label">Description</h3>
        <p className="session-card__description">
          {descriptionText}
          {showReadMore && !descriptionExpanded && (
            <button
              type="button"
              className="session-card__read-more"
              onClick={() => setDescriptionExpanded(true)}
            >
              Read More
            </button>
          )}
        </p>
      </section>

      {partnersList.length > 0 && (
        <section className="session-card__block">
          <h3 className="session-card__label">Knowledge Partners</h3>
          <div className="session-card__tags session-card__tags--scroll">
            {partnersList.map((p, i) => (
              <span key={i} className="session-card__tag">
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      {watchUrl && (
        <section className="session-card__block session-card__watch">
          <h3 className="session-card__label">Watch</h3>
          <div className="session-card__watch-box">
            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="session-card__watch-url"
              title={watchUrl}
            >
              {watchUrl}
            </a>
            {youtubeId && (
              <div className="session-card__watch-preview">
                <iframe
                  title="Video preview"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="session-card__block session-card__people">
        <div className="session-card__people-head">
          <h3 className="session-card__label">People</h3>
          <button type="button" className="btn-add-person" onClick={addPerson} aria-label="Add person">
            + Add person
          </button>
        </div>
        <div className="session-card__people-list">
          {people.map((p, i) => (
            <div key={i} className="session-card__person-row">
              <input
                type="text"
                placeholder="Name"
                value={p.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
                className="session-card__person-input"
              />
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={p.linkedin_url}
                onChange={(e) => updatePerson(i, "linkedin_url", e.target.value)}
                className="session-card__person-input"
              />
              <button
                type="button"
                className="btn-remove-person"
                onClick={() => removePerson(i)}
                aria-label="Remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {people.length > 0 && (
          <div className="session-card__people-actions">
            <button type="button" className="btn-save-people" onClick={handleSavePeople} disabled={savingPeople}>
              {savingPeople ? "Saving…" : "Save people"}
            </button>
            {peopleSaveStatus && (
              <span className={`save-status ${peopleSaveStatus.startsWith("Error") ? "error" : ""}`}>
                {peopleSaveStatus}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="session-card__block transcript-section">
        <div className="transcript-header">
          <h3 className="session-card__label">Transcript</h3>
          {hasTranscript && <span className="badge">Transcript</span>}
          {!editMode ? (
            <button type="button" className="btn-edit" onClick={() => setEditMode(true)}>
              Edit
            </button>
          ) : (
            <div className="transcript-actions">
              <button type="button" className="btn-save" onClick={handleSave} disabled={saving}>
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
            rows={6}
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
      </section>
    </article>
  );
}
