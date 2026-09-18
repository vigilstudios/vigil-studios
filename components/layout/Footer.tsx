import Link from "next/link";
import { EmailLink } from "@/components/site/Email";
import { TAGLINE } from "@/lib/site-copy";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Products",
    links: [
      { label: "Websites", href: "/products/websites" },
      { label: "Vigil Express catalogue", href: "/express" },
      { label: "Vigil", href: "/products/vigil" },
      { label: "Virtue", href: "/products/virtue" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Questions", href: "/#faq" },
      { label: "Contact", href: "/#get-started" },
      { label: "Service agreement", href: "/terms" },
    ],
  },
  {
    title: "Customers",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Your dashboard", href: "/dashboard" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-[1] border-t border-[rgba(245,245,243,0.12)] bg-[#0a0a0a] text-[#f5f5f3]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em]">
              Vigil Studios<span className="text-[color:var(--accent)]">*</span>
            </p>
            <p className="mt-4 max-w-xs font-[family-name:var(--font-space-grotesk)] text-lg font-medium leading-snug tracking-[-0.01em]">{TAGLINE}</p>
            <p className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(245,245,243,0.5)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_8px_var(--accent)]" aria-hidden />
              Keeping watch · New York
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-[rgba(245,245,243,0.5)]">{c.title}</h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13.5px] text-[rgba(245,245,243,0.62)] transition-colors hover:text-[#f5f5f3]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-[rgba(245,245,243,0.12)] pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(245,245,243,0.5)] md:flex-row md:items-center md:justify-between">
          <p>© {year} Vigil Studios · New York</p>
          <EmailLink className="inline-flex items-center gap-2 normal-case tracking-normal transition-colors hover:text-[#f5f5f3]" icon="h-3.5 w-3.5" />
        </div>
      </div>
    </footer>
  );
}
