"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductsMenu } from "@/components/layout/ProductsMenu";
import { PRODUCT_LINKS } from "@/lib/site-copy";

/**
 * The top bar in the hero's HUD language: small mono labels, no logo, no
 * chrome. Left the name, middle the pages, right the two ways in. It sits
 * transparent over the hero and gains a fade from the page colour once the
 * visitor has scrolled, so it stays readable over content.
 */
export const NAV_LABEL = "font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors";
const quiet = `${NAV_LABEL} text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]`;
const loud = `${NAV_LABEL} text-[color:var(--text-primary)]`;

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let attachedToWindow = false;
    let observer: MutationObserver | null = null;

    const handleScroll = () => {
      const scrollTop = containerRef.current ? containerRef.current.scrollTop : window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    const attachToContainer = (el: HTMLElement) => {
      if (containerRef.current === el) return;
      // detach any previous window listener
      if (attachedToWindow) {
        window.removeEventListener("scroll", handleScroll);
        attachedToWindow = false;
      }
      containerRef.current = el;
      el.addEventListener("scroll", handleScroll);
      // run once to initialize state
      handleScroll();
    };

    // initial attempt to find container
    const initial = document.getElementById("site-root") as HTMLElement | null;
    if (initial) {
      attachToContainer(initial);
    } else {
      // fallback to window while waiting for main to mount
      window.addEventListener("scroll", handleScroll);
      attachedToWindow = true;

      // observe DOM for insertion of #site-root
      observer = new MutationObserver(() => {
        const found = document.getElementById("site-root") as HTMLElement | null;
        if (found) {
          attachToContainer(found);
          if (observer) {
            observer.disconnect();
            observer = null;
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
      if (attachedToWindow) {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

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
      className={`fixed left-0 right-0 top-0 z-50 transition-colors duration-300 ${
        isOpen ? "bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]" : isScrolled ? "bg-[linear-gradient(to_bottom,var(--nav-fade-start),transparent)]" : "bg-transparent"
      }`}
    >
      <div className="grid h-14 grid-cols-[1fr_auto] items-center px-5 md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-10">
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
          <button onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} className="-mr-2 rounded-lg p-2 text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--bg-surface-soft)]">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
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
