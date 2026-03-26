import { NextRequest, NextResponse } from "next/server";
import { hashPassword, loadUsers, saveUsers } from "../store";

function uid() {
  return `u_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const users = await loadUsers();
  if (users.some((u) => u.email === email)) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const now = new Date().toISOString();
  const user = { id: uid(), email, password_hash: hashPassword(password), provider: "email" as const, created_at: now, updated_at: now };
  users.push(user);
  await saveUsers(users);

  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set("pt_user", user.id, { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}
