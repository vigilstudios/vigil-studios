"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CalendlyPopup } from "@/components/CalendlyModal";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const rootTheme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(rootTheme);

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<string>).detail as
        | "dark"
        | "light";
      setTheme(nextTheme);
    };

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

    window.addEventListener("site-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("site-theme-change", handleThemeChange);
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
    { href: "/#services", label: "Services" },
    { href: "/#process", label: "Process" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#portfolio", label: "Projects" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOpen
          ? "bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]"
          : isScrolled
          ? "bg-transparent shadow-none"
          : "bg-transparent shadow-none"
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
          <div className="md:flex items-center gap-6 h-14 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 backdrop-blur-xl px-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>
          <CalendlyPopup className="btn-primary h-14 flex items-center justify-center rounded-[1.25rem]">
            Book a Call
          </CalendlyPopup>
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
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors font-medium"
                >
                  {item.label}
                </a>
              ))}
              <CalendlyPopup className="btn-primary h-14 flex items-center justify-center rounded-[1.25rem]">
                Book a Call
              </CalendlyPopup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
