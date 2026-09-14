import Image from "next/image";
import { clsx } from "clsx";

/** Theme-aware wordmark. Swaps with the `data-theme` attribute set by ThemeToggle. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center", className)}>
      <Image
        src="/vigil-vstar-white.svg"
        alt="Vigil"
        width={32}
        height={32}
        className="[html[data-theme=light]_&]:hidden"
        style={{ height: "2rem", width: "auto" }}
        priority
      />
      <Image
        src="/vigil-vstar-black.svg"
        alt="Vigil"
        width={32}
        height={32}
        className="hidden [html[data-theme=light]_&]:inline"
        style={{ height: "2rem", width: "auto" }}
        priority
      />
    </span>
  );
}
