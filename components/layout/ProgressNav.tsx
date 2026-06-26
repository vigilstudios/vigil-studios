"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProgressNav() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [active, setActive] = useState<number>(0);

  useEffect(() => {
    observerRef.current?.disconnect();

    const timeout = window.setTimeout(() => {
      const main =
        document.querySelector("main#site-root") ||
        document.querySelector("main");

      if (!main) return;

      const secs = Array.from(main.querySelectorAll<HTMLElement>("section"));

      setSections(secs);
      setActive(0);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = secs.indexOf(entry.target as HTMLElement);
              if (idx !== -1) setActive(idx);
            }
          });
        },
        { threshold: 0.6 }
      );

      secs.forEach((s) => observer.observe(s));
      observerRef.current = observer;
    }, 100);

    return () => {
      window.clearTimeout(timeout);
      observerRef.current?.disconnect();
    };
  }, [pathname]);

  const handleClick = (i: number) => {
    const el = sections[i];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (sections.length === 0) return null;

  if (pathname !== "/") return null;

  return (
    <nav
      className="progress-nav fixed left-6 top-1/2 transform -translate-y-1/2 hidden md:flex flex-col items-center gap-4 z-40"
      aria-label="Page progress"
    >
      {sections.map((_, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          aria-current={i === active}
          className={`progress-step relative w-0.5 h-16 rounded transition-all ${
            i === active
              ? "bg-[color:var(--accent)] scale-y-110"
              : "bg-[color:var(--border)]"
          }`}
        />
      ))}
    </nav>
  );
}
