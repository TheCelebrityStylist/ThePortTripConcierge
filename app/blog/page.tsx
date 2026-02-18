import type { Metadata } from "next";
import BlogIndexClient from "./BlogIndexClient";
import { BLOG_POSTS, BLOG_REGIONS, BLOG_TIME_WINDOWS } from "../data/blog-cms";

export const metadata: Metadata = {
  title: "Cruise Port Guides | PortTrip",
  description:
    "Actionable cruise port guides with transport timing, return safety buffers, and itinerary decisions tailored to real port windows.",
  alternates: { canonical: "https://porttrip.com/blog" }
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <BlogIndexClient posts={BLOG_POSTS} regions={BLOG_REGIONS} timeWindows={BLOG_TIME_WINDOWS} />
      </div>
    </main>
  );
}
