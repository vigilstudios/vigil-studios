import { Clock3, Mail, MessagesSquare, Video } from "lucide-react";
import PortalSection from "./PortalSection";

const communicationItems = [
  {
    title: "Project Updates",
    description:
      "You’ll receive clear updates at major milestones instead of vague check-ins.",
    icon: MessagesSquare,
  },
  {
    title: "Response Times",
    description:
      "Most messages are answered within 1 business day unless otherwise noted.",
    icon: Clock3,
  },
  {
    title: "Meetings",
    description:
      "Calls are scheduled when needed for strategy, review, or launch handoff.",
    icon: Video,
  },
  {
    title: "Email First",
    description:
      "Important approvals, deliverables, and decisions should stay documented through email.",
    icon: Mail,
  },
];

export default function Communication() {
  return (
    <PortalSection
      eyebrow="Communication"
      title="How we’ll stay aligned."
      description="The goal is simple: clear communication, fewer surprises, and no confusion about what happens next."
    >
      <div className="grid gap-3">
        {communicationItems.map((item) => {
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