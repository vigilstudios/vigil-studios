"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InlineWidget } from "react-calendly";
import { X } from "lucide-react";

type CalendlyPopupProps = {
  children: React.ReactNode;
  className?: string;
};

const BASE_URL =
  "https://calendly.com/hello-vigilstudios/website-strategy-call";

export function CalendlyPopup({
  children,
  className = "",
}: CalendlyPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState(BASE_URL);

  useEffect(() => {
    setMounted(true);

    const updateCalendlyTheme = () => {
      const styles = getComputedStyle(document.documentElement);

      const backgroundColor = styles
        .getPropertyValue("--bg-primary")
        .trim()
        .replace("#", "");

      const textColor = styles
        .getPropertyValue("--text-primary")
        .trim()
        .replace("#", "");

      const primaryColor = styles
        .getPropertyValue("--accent")
        .trim()
        .replace("#", "");

      setCalendlyUrl(
        `${BASE_URL}?background_color=${backgroundColor}&text_color=${textColor}&primary_color=${primaryColor}&hide_gdpr_banner=1`
      );
    };

    updateCalendlyTheme();

    window.addEventListener("site-theme-change", updateCalendlyTheme);

    return () => {
      window.removeEventListener("site-theme-change", updateCalendlyTheme);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-[2rem]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close booking popup"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 z-[10000] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              >
                <X size={20} />
              </button>

              <InlineWidget
                key={calendlyUrl}
                url={calendlyUrl}
                styles={{
                  height: "760px",
                  width: "100%",
                  colorScheme: "light",
                }}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {modal}
    </>
  );
}