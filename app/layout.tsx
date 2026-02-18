import type { Metadata } from "next";
import "./globals.css";
import Footer from "./components/footer";
import Nav from "./components/Nav";
import { PlanningProvider } from "./components/PlanningProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://porttrip.com"),
  title: "PortTrip Cruise Intelligence System",
  description: "The cruise-specific AI planning platform with ship-aware timing, return-risk scoring, route optimization, and budget intelligence.",
  alternates: { canonical: "https://porttrip.com" },
  openGraph: {
    title: "PortTrip Cruise Intelligence System",
    description: "Smarter than generic prompts. Build safer, cheaper, and better cruise port days.",
    url: "https://porttrip.com",
    siteName: "PortTrip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PortTrip Cruise Intelligence System",
    description: "Cruise-specific AI planning platform.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="text-slate-100">
        <PlanningProvider>
          <Nav />
          {children}
          <Footer />
        </PlanningProvider>
      </body>
    </html>
  );
}
