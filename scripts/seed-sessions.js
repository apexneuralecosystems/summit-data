/**
 * Standalone seed script (alternative to migrations).
 * Run: node scripts/seed-sessions.js
 */
require("dotenv/config");
const { MongoClient } = require("mongodb");
const { readFileSync } = require("fs");
const { join } = require("path");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongo:azxd4sgjly0aqgfh@indian-ai-summit-sessions-ltrzho:27017";
const DB_NAME = process.env.MONGODB_DB || "admin";
const COLLECTION = process.env.MONGODB_COLLECTION || "sessions";

async function main() {
  const jsonPath = join(__dirname, "indiaai_sessions_formatted.json");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const docs = data.map((r) => ({ ...r, transcript: r.transcript ?? "" }));

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const coll = db.collection(COLLECTION);

  await coll.deleteMany({});
  await coll.insertMany(docs);
  await coll.createIndex({ website_index: 1 });

  console.log(`Seeded ${docs.length} sessions into ${DB_NAME}.${COLLECTION}`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
