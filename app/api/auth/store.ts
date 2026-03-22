import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type User = {
  id: string;
  email: string;
  password_hash: string;
  provider: "email" | "google" | "apple";
  created_at: string;
  updated_at: string;
};

const FILE = path.join(process.cwd(), "app", "data", "users.json");

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function loadUsers(): Promise<User[]> {
  const raw = await readFile(FILE, "utf-8").catch(() => "[]");
  return JSON.parse(raw) as User[];
}

export async function saveUsers(users: User[]) {
  await writeFile(FILE, JSON.stringify(users, null, 2), "utf-8");
}
