"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!res.ok) return setErr("Could not sign up.");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-slate-300">Save plans, duplicate itineraries, and export branded PDFs.</p>
        <input className="mt-4 w-full rounded bg-white/10 px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded bg-white/10 px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
        <button className="mt-4 w-full rounded bg-cyan-500 px-4 py-2 font-medium text-slate-900">Sign up</button>
        <p className="mt-4 text-sm">Already have an account? <Link href="/login" className="underline">Login</Link></p>
      </form>
    </main>
  );
}
