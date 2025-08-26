import "./globals.css";

export const metadata = {
  title: "PortTrip Concierge",
  description: "Interactive, tailored cruise port plans grounded in your database.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://app.porttrip.com";

export const metadata: Metadata = {
  title: "PortTrip — Your AI concierge for perfect port days",
  description:
    "Ask anything about a cruise port and get a precise, timed plan: best route, costs, return-to-ship buffer, and insider tips — grounded in your private database.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "PortTrip — Your AI concierge for perfect port days",
    description:
      "Precise, timed port-day plans with costs, timing buffers, and insider tips.",
    url: siteUrl,
    siteName: "PortTrip",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PortTrip — Your AI concierge for perfect port days",
    description:
      "Precise, timed port-day plans with costs, timing buffers, and insider tips.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}

