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
        className="h-8 w-auto [html[data-theme=light]_&]:hidden"
        priority
      />
      <Image
        src="/vigil-vstar-black.svg"
        alt="Vigil"
        width={32}
        height={32}
        className="hidden h-8 w-auto [html[data-theme=light]_&]:inline"
        priority
      />
    </span>
  );
}
