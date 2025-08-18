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
