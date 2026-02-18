/**
 * migrate-mongo config (CommonJS)
 * Uses MONGODB_URI env var. Default for Dockploy internal network.
 */
require("dotenv/config");

const config = {
  mongodb: {
    url: process.env.MONGODB_URI || "mongodb://mongo:azxd4sgjly0aqgfh@indian-ai-summit-sessions-ltrzho:27017",
    databaseName: process.env.MONGODB_DB || "admin",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".cjs",
};

module.exports = config;
