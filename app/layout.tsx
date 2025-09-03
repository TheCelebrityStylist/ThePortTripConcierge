// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://porttrip.com"),
  title: "PortTrip — Your AI concierge for perfect port days",
  description:
    "Ask anything about a cruise port and get a precise, timed plan: best route, costs, and a safe ship-return buffer.",
  openGraph: {
    title: "PortTrip — Your AI concierge for perfect port days",
    description:
      "Ask anything about a cruise port and get a precise, timed plan.",
    url: "https://porttrip.com",
    siteName: "PortTrip",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="text-slate-100">
        {children}
        <Footer />
        <Analytics />

        {/* Basic JSON-LD for SEO (no logo or Twitter needed) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PortTrip",
              url: "https://porttrip.com"
            })
          }}
        />
      </body>
    </html>
  );
}
