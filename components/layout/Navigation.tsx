"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSiteTheme } from "@/components/ui/useSiteTheme";
import { ProductsMenu } from "@/components/layout/ProductsMenu";
import { PRODUCT_LINKS } from "@/lib/site-copy";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const theme = useSiteTheme();

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

  const navItems = [
    { href: "/pricing", label: "Pricing" },
    { href: "/#get-started", label: "Contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOpen
          ? "bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]"
          : isScrolled
          ? "bg-[linear-gradient(0deg,transparent_0%,var(--bg-primary)_100%)] shadow-none"
          : "bg-[linear-gradient(0deg,transparent_0%,var(--bg-primary)_100%)] shadow-none"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Vigil Studios home">
          <img
            src={theme === "dark" ? "/vigil-vstar-white.svg" : "/vigil-vstar-black.svg"}
            alt="Vigil VStar logo"
            className="h-9 w-auto"
          />
          <span className="sr-only">Vigil VStar</span>
        </Link>

        {/* Desktop Floating Nav */}
        <div className="hidden md:flex items-center gap-3">
          <div className="h-14 w-14 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 backdrop-blur-xl flex items-center justify-center">
            <ThemeToggle />
          </div>
          <div className="md:flex items-center gap-6 h-14 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 backdrop-blur-xl px-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]">
            <ProductsMenu />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/login"
            className="h-14 flex items-center justify-center rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 px-5 text-sm font-medium text-[color:var(--text-secondary)] backdrop-blur-xl transition-colors hover:text-[color:var(--text-primary)]"
          >
            Sign in
          </Link>
          <Link href="/#start" className="btn-primary h-14 flex items-center justify-center rounded-[1.25rem]">
            Get started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="h-14 w-14 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 backdrop-blur-xl flex items-center justify-center">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-[color:var(--bg-secondary)] rounded-[1.25rem] transition-colors"
          >
            {isOpen ? (
              <X size={24} className="text-[color:var(--text-primary)]" />
            ) : (
              <Menu size={24} className="text-[color:var(--text-primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]"
          >
            <div className="container-wide py-6 flex flex-col gap-4">
              <div>
                <Link href="/products" onClick={() => setIsOpen(false)} className="text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors font-medium">
                  Products
                </Link>
                <ul className="mt-2 flex flex-col gap-1 border-l border-[color:var(--border)] pl-4">
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="btn-secondary h-14 flex items-center justify-center rounded-[1.25rem]"
              >
                Sign in
              </Link>
              <Link href="/#start" onClick={() => setIsOpen(false)} className="btn-primary h-14 flex items-center justify-center rounded-[1.25rem]">
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
