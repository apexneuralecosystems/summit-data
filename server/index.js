/**
 * Express API for India AI Summit sessions (PostgreSQL)
 * GET /api/sessions - list all
 * GET /api/sessions/:id - get one by id or website_index
 * PATCH /api/sessions/:id/transcript - update transcript
 */
require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URI;
const PORT = parseInt(process.env.PORT) || 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

let pool;

async function connect() {
  if (!DATABASE_URL) {
    throw new Error("Set DATABASE_URL or POSTGRES_URI in .env");
  }
  pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query("SELECT 1");
}

app.get("/api/sessions", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    let where = "";
    const params = [];
    if (q) {
      where = "WHERE title ILIKE $1 OR speakers ILIKE $1 OR description ILIKE $1";
      params.push("%" + q + "%");
    }

    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM sessions " + where,
      params
    );
    const total = countResult.rows[0].total;

    params.push(limit, offset);
    const sessionsResult = await pool.query(
      `SELECT id, website_index, title, date, "time", venue, room, speakers, description, knowledge_partners, watch_live_link, transcript
       FROM sessions ${where}
       ORDER BY website_index ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const sessions = sessionsResult.rows.map((row) => ({
      _id: row.id,
      website_index: row.website_index,
      title: row.title,
      date: row.date,
      time: row.time,
      venue: row.venue,
      room: row.room,
      speakers: row.speakers,
      description: row.description,
      knowledge_partners: row.knowledge_partners,
      watch_live_link: row.watch_live_link,
      transcript: row.transcript || "",
    }));

    res.json({ sessions, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sessions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const byId = /^\d+$/.test(id);
    const result = await pool.query(
      byId
        ? "SELECT * FROM sessions WHERE id = $1"
        : "SELECT * FROM sessions WHERE website_index = $1",
      [byId ? parseInt(id, 10) : id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "Session not found" });
    res.json({
      _id: row.id,
      website_index: row.website_index,
      title: row.title,
      date: row.date,
      time: row.time,
      venue: row.venue,
      room: row.room,
      speakers: row.speakers,
      description: row.description,
      knowledge_partners: row.knowledge_partners,
      watch_live_link: row.watch_live_link,
      transcript: row.transcript || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/sessions/:id/transcript", async (req, res) => {
  try {
    const id = req.params.id;
    const transcript = String(req.body.transcript ?? "");
    const byId = /^\d+$/.test(id);
    const result = await pool.query(
      `UPDATE sessions SET transcript = $1 WHERE ${byId ? "id" : "website_index"} = $2 RETURNING *`,
      [transcript, byId ? parseInt(id, 10) : id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "Session not found" });
    res.json({
      _id: row.id,
      website_index: row.website_index,
      title: row.title,
      date: row.date,
      time: row.time,
      venue: row.venue,
      room: row.room,
      speakers: row.speakers,
      description: row.description,
      knowledge_partners: row.knowledge_partners,
      watch_live_link: row.watch_live_link,
      transcript: row.transcript || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

connect()
  .then(() => {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) next();
      });
    });
    app.listen(PORT, () => console.log("Server http://localhost:" + PORT));
  })
  .catch((err) => {
    console.error("DB connect failed:", err);
    process.exit(1);
  });
