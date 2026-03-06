#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * This script initializes the database schema and seeds default data.
 * Can be run standalone or as part of server startup.
 *
 * Usage: node scripts/initDb.js
 */

require("dotenv").config();
const { initDatabase } = require("../models/initDatabase");
const { closeDatabase } = require("../models/database");

async function main() {
  try {
    await initDatabase();
    console.log("\n✓ Database initialization completed successfully");
    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Database initialization failed:", error.message);
    closeDatabase();
    process.exit(1);
  }
}

main();
