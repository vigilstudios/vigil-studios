import { Globe2, Lock, Server, Settings2 } from "lucide-react";
import PortalSection from "./PortalSection";

const domainItems = [
  {
    title: "Existing Domain",
    description:
      "If you already own a domain, we’ll guide you through the DNS changes needed for launch.",
    icon: Globe2,
  },
  {
    title: "New Domain",
    description:
      "If you need a domain, we’ll help you choose one and make sure ownership stays under your name.",
    icon: Lock,
  },
  {
    title: "Hosting Setup",
    description:
      "Your website will be deployed using a modern hosting workflow built for speed and reliability.",
    icon: Server,
  },
  {
    title: "DNS Configuration",
    description:
      "Before launch, we’ll connect your domain, SSL, redirects, and production environment.",
    icon: Settings2,
  },
];

export default function DomainHosting() {
  return (
    <PortalSection
      eyebrow="Domain & Hosting"
      title="Your launch foundation."
      description="We’ll make sure your domain, hosting, and technical setup are handled correctly before the site goes live."
    >
      <div className="space-y-3">
        {domainItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--bg-surface-soft)] text-[color:var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="font-medium text-[color:var(--text-primary)]">
                  {item.title}
                </h3>
              </div>

              <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </PortalSection>
  );
}