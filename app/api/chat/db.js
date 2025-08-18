import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Open SQLite connection (the .db file should be in /public or /app/data)
export async function getDb() {
  return open({
    filename: "./app/data/database.db", // adjust path if needed
    driver: sqlite3.Database,
  });
}

// Simple query helper
export async function searchPort(query) {
  const db = await getDb();
  // Very basic search — you can refine later
  const rows = await db.all(
    "SELECT * FROM ports WHERE city LIKE ? OR description LIKE ? LIMIT 5",
    [`%${query}%`, `%${query}%`]
  );
  return rows;
}
