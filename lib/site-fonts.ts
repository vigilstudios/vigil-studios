import localFont from "next/font/local";

// Bundle Inter locally: Google can return extensionless font URLs that fail
// Next's font downloader on a clean build runner.
export const inter = localFont({
  src: "../public/fonts/inter/InterVariable.woff2",
  variable: "--font-inter",
  weight: "400 700",
  style: "normal",
  display: "swap",
});
