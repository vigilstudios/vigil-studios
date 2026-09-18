import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { StarCursor } from "@/components/site/StarCursor";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  url,
} from "@/lib/site";

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

/** The HUD face: the navigation labels, the hero's small lines. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "small business website",
    "managed website",
    "website hosting and updates",
    "Vigil Express",
    "New York web design",
    "AI employee for small business",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Icons are not declared here on purpose: defining `metadata.icons` suppresses
  // the app/ file conventions (favicon.ico, icon.svg, apple-icon.png, manifest.ts),
  // which emit the correct types, sizes, and cache-busting hashes on their own.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: url("/icon-512.png"),
              description: SITE_DESCRIPTION,
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: "Vigil",
              url: SITE_URL,
            }),
          }}
        />
      </head>
      <body className="font-sans">
        <Navigation />
        <main id="site-root" className="h-dvh overflow-y-auto">
          {children}
        </main>
        <StarCursor />
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
