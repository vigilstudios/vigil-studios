import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileSignature,
  Globe2,
  Handshake,
  LayoutTemplate,
  LifeBuoy,
  MessageCircle,
  Paintbrush,
  Rocket,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

export const portalClient = {
  name: "Client Name",
  projectName: "Website Build",
  packageName: "Professional Website",
  currentPhase: "Client Onboarding",
  launchWindow: "4–6 weeks",
};

export const timelineSteps = [
  {
    title: "Strategy Call",
    description: "We align on your goals, business, offer, and ideal customer.",
    icon: CalendarDays,
    status: "complete",
  },
  {
    title: "Proposal & Scope",
    description: "Your project scope, timeline, and deliverables are finalized.",
    icon: ClipboardList,
    status: "complete",
  },
  {
    title: "Contract & Payment",
    description: "Your agreement is signed and your project is officially reserved.",
    icon: FileSignature,
    status: "complete",
  },
  {
    title: "Client Onboarding",
    description: "You provide the assets and information needed to begin.",
    icon: UploadCloud,
    status: "active",
  },
  {
    title: "Design Direction",
    description: "We define the visual direction before development begins.",
    icon: Paintbrush,
    status: "upcoming",
  },
  {
    title: "Website Build",
    description: "Your custom website is designed, developed, and optimized.",
    icon: Code2,
    status: "upcoming",
  },
  {
    title: "Review & Revisions",
    description: "You review the site and request final refinements.",
    icon: MessageCircle,
    status: "upcoming",
  },
  {
    title: "Launch",
    description: "We connect your domain, test everything, and go live.",
    icon: Rocket,
    status: "upcoming",
  },
  {
    title: "Post-Launch Support",
    description: "We monitor the launch and support you after handoff.",
    icon: LifeBuoy,
    status: "upcoming",
  },
];

export const checklistItems = [
  {
    id: "brand-assets",
    title: "Upload brand assets",
    description: "Logo, colors, fonts, brand guide, and visual references.",
    icon: UploadCloud,
  },
  {
    id: "website-copy",
    title: "Provide website content",
    description: "Homepage, about, services, contact info, and key messaging.",
    icon: LayoutTemplate,
  },
  {
    id: "domain-info",
    title: "Confirm domain details",
    description: "Let us know if you already own a domain or need one.",
    icon: Globe2,
  },
  {
    id: "communication",
    title: "Review communication expectations",
    description: "Understand how updates, revisions, and meetings will work.",
    icon: Handshake,
  },
  {
    id: "launch-approval",
    title: "Prepare for launch approval",
    description: "Know what happens before your new website goes live.",
    icon: BadgeCheck,
  },
];

export const buildProgress = [
  {
    label: "Onboarding",
    value: 100,
  },
  {
    label: "Design Direction",
    value: 25,
  },
  {
    label: "Development",
    value: 0,
  },
  {
    label: "Review",
    value: 0,
  },
  {
    label: "Launch",
    value: 0,
  },
];

export const faqItems = [
  {
    question: "What happens now that I’ve paid?",
    answer:
      "Your project is officially reserved. The next step is completing this onboarding portal so we have everything needed to begin strategy, design, and development.",
  },
  {
    question: "Do I need to have all my content ready right now?",
    answer:
      "No. Provide as much as you can. If something is missing, we’ll identify it early and guide you through what is needed before the build begins.",
  },
  {
    question: "Where do I upload files?",
    answer:
      "For V1, this portal shows the exact files we need. In the next version, this section will support direct uploads through your private client account.",
  },
  {
    question: "How will updates be shared?",
    answer:
      "You’ll receive structured updates at key milestones. The goal is to avoid confusion, reduce back-and-forth, and keep you confident throughout the project.",
  },
  {
    question: "When does the website go live?",
    answer:
      "Launch happens after design, development, review, revisions, testing, and your final approval. Your estimated launch window is shown at the top of this portal.",
  },
];

export const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Protected Process",
    description: "Every step is documented so nothing important gets missed.",
  },
  {
    icon: CheckCircle2,
    title: "Clear Expectations",
    description: "You always know what is happening and what we need next.",
  },
  {
    icon: Rocket,
    title: "Launch Focused",
    description: "The entire portal is designed to move your project toward launch.",
  },
];