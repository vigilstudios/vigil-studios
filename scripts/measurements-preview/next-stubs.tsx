import type { AnchorHTMLAttributes } from "react";
function previewHref(href: string) {
  if (!href.startsWith("/dashboard")) return href;
  const url = new URL(href, location.origin),
    current = new URLSearchParams(location.search);
  for (const key of ["theme", "state"]) {
    const value = current.get(key);
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
export default function Link({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href ? previewHref(href) : href} />;
}
export const usePathname = () =>
  location.pathname === "/" ? "/dashboard" : location.pathname;
export const useRouter = () => ({
  refresh() {
    location.reload();
  },
  push(href: string) {
    location.href = previewHref(href);
  },
});
// Shared by isolated previews that include marketing campaign links.
export const useSearchParams = () => new URLSearchParams(location.search);
