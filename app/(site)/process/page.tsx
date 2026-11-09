import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClientJourney } from "@/components/site/ClientJourney";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { Footer } from "@/components/layout/Footer";
import { GetStartedSection } from "@/sections/GetStartedSection";

export const metadata: Metadata = {
  title: "How it works | Vigil Studios",
  description: "From choosing your first website through launch, inquiries, bookings, and ongoing care. See what you do and what Vigil handles.",
  alternates: { canonical: "/process" },
};

const firstSteps = [
  { title: "Choose your website and plan", body: "Pick an Express design, check your fit for Professional, or talk with us about a bespoke Growth build. You’ll see the build fee and recurring plan separately." },
  { title: "Create your account and pay", body: "Verify your email to keep your selected package attached to your account. Review the order before opening secure checkout. A free account is also available while you decide." },
  { title: "Open your dashboard", body: "After payment, open the setup guide to tell us about your business and share your assets. We’ll use your brief to start the build and send you a preview for approval." },
];

export default function ProcessPage() {
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <SectionIntro heading="h1" eyebrow="From purchase to publish" title="Know what happens next." lead="Start online when you know what you need, or talk to us first. Your dashboard carries the project from your first brief through launch." />
          <ol className="mt-10 grid gap-3 md:grid-cols-3">
            {firstSteps.map(({ title, body }, index) => (
              <li key={title} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
                <span className="font-mono text-xs text-[color:var(--accent)]">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{body}</p>
              </li>
            ))}
          </ol>
          <Link href="/find-your-fit" className="btn-primary mt-7 min-h-11 gap-2">Find my website fit <ArrowRight size={16} aria-hidden /></Link>
        </Container>
      </Section>
      <ClientJourney />
      <GetStartedSection />
      <Footer />
    </>
  );
}
