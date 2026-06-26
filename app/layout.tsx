import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import ProgressNav from "@/components/layout/ProgressNav";
import { Navigation } from "@/components/layout/Navigation";

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
  metadataBase: new URL("https://www.vigilstudios.co"),
  alternates: {
    canonical: "https://www.vigilstudios.co",
  },
  title: "Vigil Studios | Web Development Agency",
  description:
    "Custom-coded websites built for speed, search visibility, and measurable growth. No templates. No compromises.",
  keywords: [
    "web design",
    "web development",
    "Long Island web developer",
    "New York web developer",
    "custom websites",
    "SEO services",
  ],
  openGraph: {
    title: "Vigil Studios | Web Development Agency",
    description:
      "Custom-coded websites built for speed, search visibility, and measurable growth. No templates. No compromises.",
    url: "https://www.vigilstudios.co",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vigil Studios | Web Development Agency",
    description: "Custom-coded websites built for speed, search visibility, and measurable growth. No templates. No compromises.",
  },
  icons: {
    icon: "/vigil-vstar-white.svg",
    shortcut: "/vigil-vstar-white.svg",
    apple: "/vigil-vstar-white.svg",
  },
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
              name: "Vigil Studios",
              url: "https://www.vigilstudios.co",
              logo: "https://www.vigilstudios.co/logo.svg",
              description:
                "Custom-coded websites built for speed, search visibility, and measurable growth. No templates. No compromises.",
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
              name: "Vigil Studios",
              alternateName: "Vigil Studios Web Development",
              url: "https://www.vigilstudios.co",
            }),
          }}
        />
      </head>
      <body className="font-sans">
        <Navigation />
        <ProgressNav />
        <main id="site-root" className="snap-y snap-proximity h-screen overflow-y-auto">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
