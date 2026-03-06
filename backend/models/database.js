const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Database configuration
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "../data/documents.db");
const DB_DIR = path.dirname(DB_PATH);

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection
let db = null;

/**
 * Get database connection instance
 * @returns {sqlite3.Database} Database connection
 */
function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error connecting to database:", err.message);
        throw err;
      }
      console.log("Connected to SQLite database at:", DB_PATH);
    });

    // Enable foreign key constraints
    db.run("PRAGMA foreign_keys = ON", (err) => {
      if (err) {
        console.error("Error enabling foreign keys:", err.message);
      }
    });
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
    db = null;
  }
}

/**
 * Run a database query with promise support
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<void>}
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Get a single row from database
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>}
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get all rows from database
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  getDatabase,
  closeDatabase,
  run,
  get,
  all,
};
