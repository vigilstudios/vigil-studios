"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const themes = {
    dark: {
      "--bg-primary": "#0a0a0a",
      "--bg-secondary": "#1a1a1a",
      "--bg-surface": "rgba(255, 255, 255, 0.04)",
      "--bg-surface-soft": "rgba(255, 255, 255, 0.06)",
      "--text-primary": "#f5f5f3",
      "--text-secondary": "#a1a1aa",
      //"--accent": "#166534",
      //"--accent-hover": "#15803d",
      "--accent": "#10D45A",
      "--accent-hover": "#0ab247",
      "--border": "rgba(255, 255, 255, 0.08)",
    },
    light: {
      "--bg-primary": "#E4F9EC",
      "--bg-secondary": "#CEE1D6",
      "--bg-surface": "rgba(17, 24, 39, 0.04)",
      "--bg-surface-soft": "rgba(17, 24, 39, 0.08)",
      "--text-primary": "#111827",
      "--text-secondary": "#4b5563",
      //"--accent": "#10D45A",
      //"--accent-hover": "#0ab247",
      "--accent": "#1E8846",
      "--accent-hover": "#15803d",
      "--border": "rgba(17, 24, 39, 0.08)",
    },
  };
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("site-theme") as
      | "dark"
      | "light"
      | null;

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
      applyTheme("light");
    } else {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (selectedTheme: "dark" | "light") => {
    const root = document.documentElement;
    const themeValues = themes[selectedTheme];
    Object.entries(themeValues).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.dataset.theme = selectedTheme;
    window.dispatchEvent(
      new CustomEvent("site-theme-change", { detail: selectedTheme })
    );
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem("site-theme", nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-14 w-14 inline-flex items-center justify-center rounded-[1.25rem] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)] transition-colors"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
