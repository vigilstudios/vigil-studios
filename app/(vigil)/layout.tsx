import type { Metadata } from "next";
import { PromoBanner } from "@/components/creators/PromoBanner";
import { Space_Grotesk } from "next/font/google";
import { inter } from "@/lib/site-fonts";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import { themeBootstrapScript } from "@/lib/site-theme";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
    // suppressHydrationWarning: the bootstrap script below sets data-theme on
    // <html> before React hydrates, on purpose.
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <PromoBanner publicOnly />
        {children}
      </body>
    </html>
  );
}
