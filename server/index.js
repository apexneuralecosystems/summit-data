/**
 * Express API for India AI Summit sessions
 * GET /api/sessions - list all
 * GET /api/sessions/:id - get one by _id
 * PATCH /api/sessions/:id/transcript - update transcript
 */
require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo:azxd4sgjly0aqgfh@indian-ai-summit-sessions-ltrzho:27017";
const DB_NAME = process.env.MONGODB_DB || "indiaai";
const COLLECTION = process.env.MONGODB_COLLECTION || "sessions";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

let db;

async function connect() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
}

app.get("/api/sessions", async (req, res) => {
  try {
    const coll = db.collection(COLLECTION);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const q = req.query.q
      ? {
          $or: [
            { title: { $regex: req.query.q, $options: "i" } },
            { speakers: { $regex: req.query.q, $options: "i" } },
            { description: { $regex: req.query.q, $options: "i" } },
          ],
        }
      : {};
    const [sessions, total] = await Promise.all([
      coll.find(q).sort({ website_index: 1 }).skip(skip).limit(limit).toArray(),
      coll.countDocuments(q),
    ]);
    res.json({ sessions, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sessions/:id", async (req, res) => {
  try {
    const coll = db.collection(COLLECTION);
    const id = req.params.id;
    let doc;
    if (ObjectId.isValid(id) && new ObjectId(id).toString() === id) {
      doc = await coll.findOne({ _id: new ObjectId(id) });
    } else {
      doc = await coll.findOne({ website_index: parseInt(id) || id });
    }
    if (!doc) return res.status(404).json({ error: "Session not found" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/sessions/:id/transcript", async (req, res) => {
  try {
    const coll = db.collection(COLLECTION);
    const id = req.params.id;
    const { transcript } = req.body;
    const filter = ObjectId.isValid(id) && new ObjectId(id).toString() === id
      ? { _id: new ObjectId(id) }
      : { website_index: parseInt(id) || id };
    const result = await coll.findOneAndUpdate(
      filter,
      { $set: { transcript: String(transcript ?? "") } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Session not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = parseInt(process.env.PORT) || 3000;

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
