import {
  Building2,
  Camera,
  Home,
  Mail,
  MessageSquareText,
  ShoppingBag,
} from "lucide-react";
import PortalSection from "./PortalSection";

const contentItems = [
  {
    title: "Homepage Copy",
    description: "Main headline, intro copy, key benefits, and primary CTA.",
    icon: Home,
  },
  {
    title: "About Page",
    description: "Your story, background, values, team, and credibility.",
    icon: Building2,
  },
  {
    title: "Services",
    description: "Your offers, packages, service details, and ideal customers.",
    icon: ShoppingBag,
  },
  {
    title: "Contact Info",
    description: "Email, phone, location, service area, and business hours.",
    icon: Mail,
  },
  {
    title: "Photos",
    description:
      "Team photos, workspace, project images, or brand lifestyle shots.",
    icon: Camera,
  },
  {
    title: "Extra Notes",
    description: "Competitors, inspiration sites, must-have sections, or dislikes.",
    icon: MessageSquareText,
  },
];

export default function ContentGuide() {
  return (
    <PortalSection
      eyebrow="Website Content"
      title="Give us the words, photos, and details."
      description="Your content gives the site direction. The more context you provide, the stronger the final result."
    >
      <div className="grid gap-3">
        {contentItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-surface-soft)] text-[color:var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-medium text-[color:var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PortalSection>
  );
}