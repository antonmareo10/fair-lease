import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const ui = Inter({ variable: "--font-ui", subsets: ["latin"] });
const reading = Newsreader({ variable: "--font-reading", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: "Fair Lease — Is your rental contract legal?",
  description:
    "Paste your Madrid rental contract and see which clauses Spanish law doesn't allow, marked on your own text with the exact article and what to ask for instead.",
  openGraph: {
    title: "Fair Lease — Is your rental contract legal?",
    description: "Every clause Spanish law doesn't allow, marked on your own text with the exact article. For renters in Madrid.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ui.variable} ${reading.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
