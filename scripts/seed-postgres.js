require("dotenv/config");
const { Client } = require("pg");
const { readFileSync } = require("fs");
const { join } = require("path");

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URI;

async function main() {
  if (!DATABASE_URL) {
    console.error("Set DATABASE_URL or POSTGRES_URI in .env");
    process.exit(1);
  }
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const schemaPath = join(__dirname, "..", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await client.query(schema);

  const jsonPath = join(__dirname, "indiaai_sessions_formatted.json");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));

  await client.query("TRUNCATE TABLE sessions RESTART IDENTITY");

  for (const r of data) {
    await client.query(
      `INSERT INTO sessions (website_index, title, date, "time", venue, room, speakers, description, knowledge_partners, watch_live_link, transcript)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        r.website_index,
        r.title ?? "",
        r.date ?? "",
        r.time ?? "",
        r.venue ?? "",
        r.room ?? "",
        r.speakers ?? "",
        r.description ?? "",
        r.knowledge_partners ?? "",
        r.watch_live_link ?? "",
        r.transcript ?? "",
      ]
    );
  }
  console.log("Seeded " + data.length + " sessions into PostgreSQL");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
