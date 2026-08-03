import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import ProgressNav from "@/components/layout/ProgressNav";
import { Navigation } from "@/components/layout/Navigation";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "web design",
    "web development",
    "Long Island web developer",
    "New York web developer",
    "custom websites",
    "SEO services",
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
      className={`${spaceGrotesk.variable} ${inter.variable} scroll-smooth`}
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
              alternateName: "Vigil Studios Web Development",
              url: SITE_URL,
            }),
          }}
        />
      </head>
      <body className="font-sans">
        <Navigation />
        <ProgressNav />
        <main id="site-root" className="h-screen overflow-y-auto md:snap-y md:snap-proximity">
          {children}
        </main>
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
