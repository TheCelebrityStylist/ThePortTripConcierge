CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
