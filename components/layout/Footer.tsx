import Link from "next/link";
import { Mail } from "lucide-react";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
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
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight">vigil <span className="text-[color:var(--accent)]">studios*</span></p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[color:var(--text-secondary)]">{TAGLINE}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
              <VirtueOrb size="xs" label="" /> Virtue helps every Vigil customer get set up.
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{c.title}</h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-[color:var(--border)] pt-6 text-sm text-[color:var(--text-secondary)] md:flex-row md:items-center md:justify-between">
          <p>© {year} Vigil Studios. New York.</p>
          <a href="mailto:hello@vigilstudios.co" className="inline-flex items-center gap-2 transition-colors hover:text-[color:var(--text-primary)]">
            <Mail size={14} /> hello@vigilstudios.co
          </a>
        </div>
      </div>
    </footer>
  );
}
