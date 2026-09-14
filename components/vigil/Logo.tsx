import Image from "next/image";
import { clsx } from "clsx";

const sizes = { sm: 24, md: 32, lg: 40 } as const;

/** Theme-aware wordmark. Swaps with the `data-theme` attribute set by ThemeSwitch. */
export function Logo({ className, size = "md" }: { className?: string; size?: keyof typeof sizes }) {
  const px = sizes[size];
  const style = { height: px, width: "auto" };
  return (
    <span className={clsx("inline-flex items-center", className)}>
      <Image src="/vigil-vstar-white.svg" alt="Vigil" width={px} height={px} className="[html[data-theme=light]_&]:hidden" style={style} priority />
      <Image src="/vigil-vstar-black.svg" alt="Vigil" width={px} height={px} className="hidden [html[data-theme=light]_&]:inline" style={style} priority />
    </span>
  );
}
