import { NextRequest, NextResponse } from "next/server";
import { hashPassword, loadUsers } from "../store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  const users = await loadUsers();
  const user = users.find((u) => u.email === email && u.password_hash === hashPassword(password));
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set("pt_user", user.id, { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}
