import localFont from "next/font/local";

// Same bundled Inter face, with English UI glyphs and punctuation
// in the initial request. Both original variable axes are retained. All other characters
// load the original through a disjoint
// unicode-range face in public/fonts/inter/inter-extended.css.
export const inter = localFont({
  src: "../public/fonts/inter/InterVariable-latin.woff2",
  variable: "--font-inter",
  weight: "400 700",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["VigilInterExtended", "Arial"],
});
