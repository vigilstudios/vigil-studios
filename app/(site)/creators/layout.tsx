import { Bodoni_Moda } from "next/font/google";
import type { ReactNode } from "react";

const editorial = Bodoni_Moda({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-creator-editorial",
});

/** The creator campaign's editorial face is loaded only for this route. */
export default function CreatorsLayout({ children }: { children: ReactNode }) {
  return <div className={editorial.variable}>{children}</div>;
}
