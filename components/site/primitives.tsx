import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Small building blocks for the marketing pages. Deliberately plain: the
 * product UI is the brand, so these borrow its restraint (thin borders,
 * quiet surfaces, one accent) rather than adding decoration.
 */
export function Container({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={clsx("mx-auto w-full px-4 sm:px-6 lg:px-8", narrow ? "max-w-3xl" : "max-w-6xl", className)}>{children}</div>;
}

/** Section label, flush with the heading below it. */
export function Eyebrow({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "violet" | "amber" | "teal" | "muted" }) {
  const color = { accent: "var(--accent)", violet: "var(--accent-2)", amber: "var(--accent-3)", teal: "var(--accent-4)", muted: "var(--text-secondary)" }[tone];
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>
      {children}
    </p>
  );
}

export function SectionIntro({ eyebrow, tone, title, lead, align = "left", className }: { eyebrow?: string; tone?: "accent" | "violet" | "amber" | "teal" | "muted"; title: ReactNode; lead?: ReactNode; align?: "left" | "center"; className?: string }) {
  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-4xl">{title}</h2>
      {lead ? <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)] sm:text-lg sm:leading-8">{lead}</p> : null}
    </div>
  );
}

/**
 * `fill` sections (the home page) each take a full viewport with their
 * content centred, so the page reads as a sequence of rooms rather than one
 * long column; the desktop scroll snap in globals.css lands on each one.
 * Every section is opaque and sits above z-0, so the page scrolls over the
 * sticky hero instead of showing it through.
 */
export function Section({ children, className, id, alt, fill }: { children: ReactNode; className?: string; id?: string; alt?: boolean; fill?: boolean }) {
  return (
    <section id={id} className={clsx("relative z-[1]", fill ? "flex flex-col justify-center py-20 md:min-h-[100svh] md:py-24" : "py-16 sm:py-24", alt ? "border-y border-[color:var(--border)] bg-[color:var(--bg-section-alt)]" : "bg-[color:var(--bg-primary)]", className)}>
      {children}
    </section>
  );
}

export function Panel({ children, className, accent }: { children: ReactNode; className?: string; accent?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6", className)} style={accent ? { boxShadow: `inset 0 1px 0 0 color-mix(in srgb, ${accent} 45%, transparent)` } : undefined}>
      {children}
    </div>
  );
}

export function PrimaryLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx("btn-primary min-h-12 !px-6 text-sm font-semibold", className)}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx("btn-secondary min-h-12 !px-6 text-sm font-medium", className)}>
      {children}
    </Link>
  );
}

/** Status-style chip: icon + label + colour, matching the product. */
export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "accent" | "violet" | "amber" | "teal" | "muted" }) {
  const color = { accent: "var(--accent)", violet: "var(--accent-2)", amber: "var(--accent-3)", teal: "var(--accent-4)", muted: "var(--text-secondary)" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      {children}
    </span>
  );
}
