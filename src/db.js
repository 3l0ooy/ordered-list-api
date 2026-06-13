const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_items_list_position ON items(list_id, position);
`);

module.exports = db;