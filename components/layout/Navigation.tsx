"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductsMenu } from "@/components/layout/ProductsMenu";
import { PRODUCT_LINKS } from "@/lib/site-copy";

/**
 * The top bar in the hero's HUD language: small mono labels, no logo, no
 * chrome. Left the name, middle the pages, right the two ways in. It sits
 * transparent over the hero and turns solid the moment the page's content
 * reaches it (on the home page that is a full hero later; elsewhere a few
 * pixels in), so the labels never get lost in what scrolls under them.
 */
export const NAV_LABEL = "font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors";
const quiet = `${NAV_LABEL} text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]`;
const loud = `${NAV_LABEL} text-[color:var(--text-primary)]`;

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const home = usePathname() === "/";

  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // The page scrolls inside the layout's <main>, not the window.
    const container = document.getElementById("site-root");
    const target: HTMLElement | Window = container ?? window;
    const handleScroll = () => {
      const scrollTop = container ? container.scrollTop : window.scrollY;
      if (!home) {
        setIsScrolled(scrollTop > 50);
        return;
      }
      // Home: the first section is the sticky hero; the bar stays clear until the next section reaches it.
      const hero = (container ?? document).querySelector("main > section") as HTMLElement | null;
      const navHeight = navRef.current?.offsetHeight ?? 64;
      setIsScrolled(scrollTop >= (hero?.clientHeight ?? window.innerHeight) - navHeight);
    };
    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [home]);

  const pages = [
    { href: "/pricing", label: "Pricing" },
    { href: "/#get-started", label: "Contact" },
  ];

  const getStarted = (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_8px_var(--accent)]" aria-hidden />
      Get started
    </span>
  );

  return (
    <nav
      ref={navRef}
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-colors duration-300 ${
        isOpen
          ? "border-[color:var(--border)] bg-[color:var(--bg-secondary)]"
          : isScrolled
            ? "border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--bg-primary)_92%,transparent)] backdrop-blur-md"
            : "border-transparent bg-transparent"
      }`}
    >
      <div className="grid h-11 grid-cols-[1fr_auto] items-center px-5 md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <Link href="/" className={loud} aria-label="Vigil Studios home">
          Vigil Studios
        </Link>

        {/* Desktop */}
        <div className="hidden h-full items-center gap-[34px] md:flex">
          <ProductsMenu />
          {pages.map((item) => (
            <Link key={item.href} href={item.href} className={quiet}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center justify-end gap-[30px] md:flex">
          <Link href="/login" className={quiet}>
            Sign in
          </Link>
          <Link href="/#start" className={loud}>
            {getStarted}
          </Link>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-end gap-4 md:hidden">
          <Link href="/#start" className={loud} onClick={() => setIsOpen(false)}>
            {getStarted}
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} className="-mr-2 rounded-lg p-1.5 text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--bg-surface-soft)]">
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Phone menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-[color:var(--border)] bg-[color:var(--bg-secondary)] md:hidden">
            <div className="flex flex-col gap-5 px-5 py-6">
              <div>
                <Link href="/products" onClick={() => setIsOpen(false)} className={loud}>
                  Products
                </Link>
                <ul className="mt-3 flex flex-col gap-1 border-l border-[color:var(--border)] pl-4">
                  {PRODUCT_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setIsOpen(false)} className="flex flex-col py-1.5">
                        <span className="text-sm font-medium text-[color:var(--text-primary)]">{item.label}</span>
                        <span className="text-[12px] text-[color:var(--text-secondary)]">{item.blurb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {pages.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={loud}>
                  {item.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setIsOpen(false)} className={loud}>
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
