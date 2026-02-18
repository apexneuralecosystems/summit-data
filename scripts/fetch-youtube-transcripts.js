/**
 * Bulk fetch YouTube transcripts for sessions that have a YouTube watch_live_link
 * and update the transcript column in PostgreSQL.
 * Usage: npm run fetch-transcripts   (or node scripts/fetch-youtube-transcripts.js)
 * Optional: FETCH_OVERWRITE=1 to overwrite existing non-empty transcripts
 */
require("dotenv/config");
const { Client } = require("pg");
const { YoutubeTranscript } = require("youtube-transcript");

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URI;
const OVERWRITE = process.env.FETCH_OVERWRITE === "1";

function getVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  const match = u.match(/(?:v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isYoutubeUrl(link) {
  if (!link || link === "Don't have") return false;
  return getVideoId(link) !== null;
}

async function fetchTranscriptText(urlOrId) {
  const transcript = await YoutubeTranscript.fetchTranscript(urlOrId);
  const text = transcript.map((t) => t.text).join(" ");
  return text;
}

async function main() {
  if (!DATABASE_URL) {
    console.error("Set DATABASE_URL or POSTGRES_URI in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const res = await client.query(
    `SELECT id, website_index, title, watch_live_link, transcript FROM sessions
     WHERE watch_live_link IS NOT NULL AND watch_live_link != '' AND watch_live_link != 'Don''t have'
     ORDER BY website_index`
  );

  const rows = res.rows.filter((r) => {
    if (!isYoutubeUrl(r.watch_live_link)) return false;
    if (OVERWRITE) return true;
    const t = (r.transcript || "").trim();
    return t.length === 0;
  });
  console.log(`Found ${rows.length} sessions with YouTube links to process.${OVERWRITE ? " (overwrite mode)" : ""}\n`);

  let ok = 0;
  let fail = 0;

  for (const row of rows) {
    const videoId = getVideoId(row.watch_live_link);
    const label = `#${row.website_index} ${row.title?.slice(0, 40) || videoId}...`;
    try {
      const text = await fetchTranscriptText(row.watch_live_link);
      await client.query("UPDATE sessions SET transcript = $1 WHERE id = $2", [text, row.id]);
      ok++;
      console.log(`✅ ${label}`);
    } catch (err) {
      fail++;
      console.log(`❌ ${label} — ${err.message}`);
    }
  }

  console.log(`\nDone. ${ok} updated, ${fail} failed.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
