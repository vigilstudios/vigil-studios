import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Chip, Container, Section, SectionIntro } from "@/components/site/primitives";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { VirtueHero } from "./VirtueHero";

export const metadata: Metadata = {
  title: "Virtue | Vigil Studios",
  description: "Virtue is the AI employee inside Vigil. She sets up every customer today; on Growth and Priority she will follow up leads, text back missed calls and ask for reviews.",
  alternates: { canonical: "/products/virtue" },
};

const TODAY = [
  { title: "Welcomes you the moment you pay", body: "Your account exists as soon as the payment clears. Virtue greets you, sets up your password and takes you into your dashboard." },
  { title: "Learns your business in ten minutes", body: "Hours, what you offer, your story, brand and photos, one screen at a time, saved as you go, on your phone if you like." },
  { title: "Walks you through your domain", body: "She works out where your domain is managed, shows the exact records for that registrar with copy buttons, and keeps checking until it connects. Need a domain? She takes your preferred names and we register it in yours." },
  { title: "Hands it to the team", body: "When you send the brief, the people who build your site have everything, and you see where the project is from your dashboard." },
];

const COMING = [
  { title: "Lead follow-up and recovery", body: "New enquiry from the site? Virtue replies fast, asks the right questions and books the visit or call." },
  { title: "Missed-call text-back", body: "A call you could not take gets a text within seconds, so the customer stays yours." },
  { title: "Reviews and reputation", body: "After a good visit, a gentle ask for a review, and a heads-up to you when one needs a reply." },
  { title: "Customer reactivation", body: "Reaches out to people who have not been back in a while, with an offer you approve." },
  { title: "Lead Hub and Insights", body: "Every enquiry in one place; what is working and what is not, in plain language." },
];

export default function VirtuePage() {
  return (
    <>
      <VirtueHero />

      <Section id="today">
        <Container>
          <div className="flex flex-wrap items-center gap-3">
            <SectionIntro eyebrow="Today" title="What Virtue does now, for every customer." lead="Virtue the guide is included with every plan. She is not a chatbot; she runs a real, guided setup with a person's warmth and a checklist's memory." />
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {TODAY.map((t) => (
              <li key={t.title} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
                <div className="flex items-center gap-2 text-[color:var(--accent)]"><Check className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Live</span></div>
                <h3 className="mt-2 text-base font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{t.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="coming" alt>
        <Container>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionIntro eyebrow="Coming" tone="violet" title="What she will do on Growth and Priority." lead="These are being built now. They arrive as configured workflows, not tools you have to set up, and you approve anything she says on your behalf." />
            <Chip tone="violet"><Clock className="h-3 w-3" /> In development</Chip>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMING.map((t) => (
              <li key={t.title} className="rounded-2xl border border-dashed border-[color:var(--border)] p-5">
                <div className="flex items-center gap-2 text-[color:var(--accent-2)]"><Clock className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Coming</span></div>
                <h3 className="mt-2 text-base font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{t.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
            Virtue is not a separate subscription. She is included with Growth and Priority, with usage allowances that match the plan. <Link href="/pricing" className="font-medium text-[color:var(--accent)]">See the plans <ArrowRight className="inline h-3.5 w-3.5" /></Link>
          </p>
        </Container>
      </Section>

      <GetStartedSection />
      <Footer />
    </>
  );
}
