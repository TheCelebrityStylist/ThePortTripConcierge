import { NextRequest, NextResponse } from "next/server";
import { loadUsers } from "../store";

export async function GET(req: NextRequest) {
  const uid = req.cookies.get("pt_user")?.value;
  if (!uid) return NextResponse.json({ user: null });
  const users = await loadUsers();
  const user = users.find((u) => u.id === uid);
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null });
}
