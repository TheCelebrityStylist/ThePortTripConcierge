import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/app/data/blog";

export const metadata: Metadata = {
  title: "Cruise Blog | PortTrip Cruise Intelligence",
  description: "Cruise port guides, money-saving playbooks, safety tips, and DIY shore day strategy.",
  alternates: { canonical: "https://porttrip.com/blog" },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Cruise Intelligence Blog</h1>
        <p className="mt-3 text-slate-300">Categories: Cruise Port Guides, Cruise Money Saving, First Time Cruise Tips, Cruise Safety, DIY vs Ship Excursions, Cruise Packing, Cruise Food Guides.</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {blogPosts.map((post) => (
            <li key={post.slug} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-sky-300">{post.category}</p>
              <h2 className="mt-1 text-lg font-semibold"><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p className="mt-2 text-sm text-slate-300">{post.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
