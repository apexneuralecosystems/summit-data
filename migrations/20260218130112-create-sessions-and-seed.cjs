/**
 * Migration: Create sessions collection and seed from indiaai_sessions_formatted.json
 */
const fs = require("fs");
const path = require("path");

module.exports = {
  async up(db) {
    const collectionName = process.env.MONGODB_COLLECTION || "sessions";
    const jsonPath = path.join(__dirname, "..", "scripts", "indiaai_sessions_formatted.json");

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Seed file not found: ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    if (!Array.isArray(data)) {
      throw new Error("Expected JSON array");
    }

    const docs = data.map((rec) => ({
      ...rec,
      transcript: rec.transcript ?? "",
    }));

    const coll = db.collection(collectionName);
    await coll.drop().catch(() => {});
    await coll.insertMany(docs);
    await coll.createIndex({ website_index: 1 });

    console.log(`Seeded ${docs.length} sessions into ${collectionName}`);
  },

  async down(db) {
    const collectionName = process.env.MONGODB_COLLECTION || "sessions";
    await db.collection(collectionName).drop();
    console.log(`Dropped collection ${collectionName}`);
  },
};
