import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Vigil",
    template: "%s | Vigil",
  },
  description: "Your website, domain, subscription and requests, managed by Vigil Studios.",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the product: login, client dashboard and admin. Shares the
 * design tokens with the marketing site but none of its chrome.
 */
export default function VigilRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
