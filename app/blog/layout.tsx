import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cruise Intelligence Library | PortTrip",
  description: "Cruise Port Guides and planning playbooks optimized for DIY transport, return-safe buffers, and budget comparisons.",
  alternates: { canonical: "https://porttrip.com/blog" },
  openGraph: {
    title: "Cruise Intelligence Library | PortTrip",
    description: "Cruise Port Guides and planning playbooks optimized for DIY transport, return-safe buffers, and budget comparisons.",
    url: "https://porttrip.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cruise Intelligence Library | PortTrip",
    description: "Cruise Port Guides and planning playbooks optimized for DIY transport, return-safe buffers, and budget comparisons.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
