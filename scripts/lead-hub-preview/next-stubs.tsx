// Native-only stand-ins for the standalone Vite lab; never imported by the app.
/* eslint-disable @next/next/no-img-element */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) { return <a {...props} />; }
export function Image({ priority: _priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) { void _priority; return <img {...props} alt={props.alt || ''} />; }
export const usePathname = () => '/dashboard/leads';
export const useRouter = () => ({ refresh() {}, push(href: string) { location.href = href; } });
