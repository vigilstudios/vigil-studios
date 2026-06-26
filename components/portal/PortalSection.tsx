import { ReactNode } from "react";

type PortalSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function PortalSection({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: PortalSectionProps) {
  return (
    <section
      className={`rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8 ${className}`}
    >
      <div className="mb-8 max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
            {eyebrow}
          </p>
        )}

        <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}