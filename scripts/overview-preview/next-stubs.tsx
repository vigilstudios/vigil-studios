import type { AnchorHTMLAttributes } from "react";
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
export const usePathname = () => "/dashboard";
export const useRouter = () => ({
  refresh() {
    location.reload();
  },
  push(href: string) {
    location.href = href;
  },
});
