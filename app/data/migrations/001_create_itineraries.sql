CREATE TABLE IF NOT EXISTS itineraries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  port TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  all_aboard_time TEXT NOT NULL,
  safety_buffer INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  itinerary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
