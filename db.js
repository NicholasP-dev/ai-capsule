const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "capsules.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      prompt_title TEXT NOT NULL,
      prompt_version TEXT,
      prompt_text TEXT NOT NULL,
      response_summary TEXT,
      category TEXT,
      usefulness TEXT,
      reviewed INTEGER DEFAULT 0,
      improved INTEGER DEFAULT 0,
      screenshot_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Table creation error:", err.message);
    } else {
      console.log("Capsules table ready.");
    }
  });
});

module.exports = db;