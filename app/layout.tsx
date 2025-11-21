import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notices ERP | S?curit? Incendie & Accessibilit?",
  description:
    "G?n?rez des notices de s?curit? incendie et d?accessibilit? (France) pr?tes pour bureau de contr?le.",
  metadataBase: new URL("https://agentic-eea8a30f.vercel.app"),
  openGraph: {
    title: "Notices ERP | S?curit? Incendie & Accessibilit?",
    description:
      "G?n?rez des notices de s?curit? incendie et d?accessibilit? (France) pr?tes pour bureau de contr?le.",
    url: "https://agentic-eea8a30f.vercel.app",
    siteName: "Notices ERP",
    locale: "fr_FR",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

