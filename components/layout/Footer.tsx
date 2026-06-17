import Link from "next/link";
import { Mail, Github, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--bg-secondary)] snap-end">
      <div className="container-wide py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">
              vigil <span className="text-[color:var(--accent)]">studios*</span>
            </h2>
            <p className="text-[color:var(--text-secondary)] text-sm mb-6">
              Building websites that drive growth.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 hover:bg-[color:var(--bg-primary)] rounded-lg transition-colors"
              >
                <Github size={18} className="text-[color:var(--text-secondary)]" />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-[color:var(--bg-primary)] rounded-lg transition-colors"
              >
                <Linkedin size={18} className="text-[color:var(--text-secondary)]" />
              </a>
              <a
                href="#"
                className="p-2 hover:bg-[color:var(--bg-primary)] rounded-lg transition-colors"
              >
                <Twitter size={18} className="text-[color:var(--text-secondary)]" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">
              Services
            </h3>
            <ul className="space-y-3">
              {[
                "Custom Websites",
                "Landing Pages",
                "E-Commerce",
                "SEO Optimization",
                "Maintenance",
              ].map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm transition-colors"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {["About", "Portfolio", "Pricing", "Process", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">
              Contact
            </h3>
            <a
              href="mailto:hello@vigilstudios.co"
              className="flex items-center gap-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors mb-4"
            >
              <Mail size={16} />
              <span className="text-sm">hello@vigilstudios.co</span>
            </a>
            <p className="text-[color:var(--text-secondary)] text-sm">
              Serving businesses across the country
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[color:var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[color:var(--text-secondary)] text-sm">
            © {currentYear} Vigil Studios. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
