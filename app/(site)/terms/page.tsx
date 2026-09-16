import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, SectionIntro } from "@/components/site/primitives";

export const metadata: Metadata = {
  title: "Service agreement | Vigil Studios",
  description: "The terms every Vigil website is built and run under: the build, the plan, what you own, revisions, cancelling, refunds, domains and Virtue.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE = "15 September 2026";

/**
 * The service agreement in the same plain voice as the product. Each
 * section is a promise the site already makes elsewhere (pricing, FAQ,
 * the master architecture's ownership and offboarding rules) written once,
 * in order. Owner-supplied policy: the refund rule.
 */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Who this is between",
    body: [
      "This agreement is between you, the business buying a website (\"you\"), and Vigil Studios, based in New York (\"Vigil\", \"we\"). It applies when you buy a website build, subscribe to a Vigil plan, or use the Vigil dashboard and Virtue.",
      "You accept it by ticking the box at checkout, by paying a Vigil invoice or checkout link, or by using the dashboard. If someone accepts on behalf of a business, they confirm they are allowed to.",
    ],
  },
  {
    title: "2. What you are buying",
    body: [
      "There are two parts. The build is a one-time payment for the website itself: a Vigil Express site made from an industry template, a Professional site designed for you, or a Custom build with a written scope. The plan is an ongoing subscription (monthly, annual or three-year) that hosts the website, keeps the domain connected and the security certificate current, applies updates, and provides the service level of the plan you chose.",
      "Every website hosted by Vigil needs an active plan; Basic is the minimum. Prices are the ones shown at checkout or on your checkout link at the time you pay. Each plan's inclusions and allowances (for example the number of change requests, or Virtue usage) are shown on the pricing page and in your dashboard.",
    ],
  },
  {
    title: "3. How the build works",
    body: [
      "After payment, Virtue collects the details we need. Professional customers may instead book a kickoff call with our team, or complete the guided brief and upload layouts, inspiration and requirements. We start an Express build once its brief is sent; Professional and Custom follow the timeline confirmed after intake.",
      "Scope and revisions: Express is one template-based page with one revision round. Professional includes up to eight primary pages with fully custom responsive design and two revision rounds. Simple utility or legal pages do not count toward the eight-page limit. Additional primary pages are quoted separately. Custom builds follow their written scope. A round means one consolidated list of changes.",
      "Professional includes standard modern website functionality such as advanced forms, third-party booking links or embeds, simple payments, maps, reviews, analytics, conversion tracking, SEO foundations, social and marketing integrations, and CMS-driven content where appropriate. It does not include custom applications or portals, native booking infrastructure, advanced ecommerce, custom APIs, complex automation or proprietary Growth and Priority systems unless separately scoped.",
      "The site goes live on your domain once you approve it. From then on it runs under your plan.",
    ],
  },
  {
    title: "4. Payment, renewal and cancelling",
    body: [
      "The build fee is charged once, at checkout. Plan fees are charged in advance for the period you chose and renew automatically at the end of each period until you cancel. You can cancel from your dashboard at any time; the plan then ends at the close of the period already paid for, and hosting, the dashboard and any Virtue features end with it.",
      "If a plan payment fails, we will let you know and retry. If it stays unpaid, the plan lapses and the website is taken offline until it is settled. Prices can change; we give notice before a change affects a renewal.",
    ],
  },
  {
    title: "5. Refunds",
    body: [
      "The build fee is refundable in full until work on your website starts; once work has started it is not refundable. Work starts when we begin building from the brief you sent.",
      "Plan charges are not refunded for a period that has already started. If you cancel, you keep the service until the end of that period and are not charged again.",
    ],
  },
  {
    title: "6. What you own, and what stays ours",
    body: [
      "You own the site-specific source code, content and assets produced for your paid project: your pages, your words, your photos, your brand files. You own your domain from day one, in your own name, whether you brought it or we registered it for you.",
      "Vigil keeps ownership of the Vigil platform, the dashboard, Virtue, the shared templates as a reusable system, and the shared libraries, automation and infrastructure your site runs on. You get a licence to use them while you are subscribed. You may not copy, resell or reuse the template system itself.",
      "You are responsible for having the rights to what you give us (text, images, logos, customer data) and for what your website says about your business.",
    ],
  },
  {
    title: "7. Leaving",
    body: [
      "If you cancel, you can download an export of your site-specific code and assets from the dashboard, and your domain stays yours to point wherever you like. Platform credentials, shared services and Vigil's own code are not included. We keep your data for a short period after the plan ends so you can export it, then delete it.",
      "Migration help beyond the export is available as a quoted service.",
    ],
  },
  {
    title: "8. Domains",
    body: [
      "If you bring a domain, Virtue shows you the records to add at your registrar and we check the connection. The domain, its registrar account and its renewals remain yours to manage and pay for. If we register a domain for you, it is registered in your name; while you are subscribed we handle the technical connection, and the renewal cost is passed through as agreed at the time.",
    ],
  },
  {
    title: "9. Virtue",
    body: [
      "Virtue is an AI employee inside Vigil. Today she runs onboarding for every customer. Additional Virtue features are included with the plans that list them, within that plan's usage allowances. Anything Virtue sends on your behalf uses the information and approvals you give; you are responsible for reviewing what goes out under your business's name. Virtue can make mistakes, and we do not guarantee any particular business result from her work.",
    ],
  },
  {
    title: "10. Our responsibilities and their limits",
    body: [
      "We will build what you bought with reasonable care and skill, host it on reliable infrastructure, keep it secure and updated, and handle requests within your plan. We aim for the website to be available at all times but cannot promise uninterrupted service; hosting, domain and email providers, and the internet itself, are outside our control.",
      "We are not liable for indirect losses such as lost sales, profits or data, or for anything caused by content or instructions you gave us, by a third-party provider, or by your own changes. Our total liability to you for any claim is limited to the fees you paid us in the twelve months before the claim. Nothing here limits liability that cannot be limited by law.",
    ],
  },
  {
    title: "11. Acceptable use and privacy",
    body: [
      "The website must be for a lawful business and must not contain unlawful, deceptive or infringing content. We can take a site offline if it puts other customers, the platform or us at legal risk, and will tell you why.",
      "We handle your details and your customers' details only to provide the service, and we do not sell them. Payments are processed by Stripe; we do not store card numbers.",
    ],
  },
  {
    title: "12. Changes and contact",
    body: [
      `This version is effective ${EFFECTIVE}. If we change these terms, we will publish the new version here and notify active customers; continuing to use the service after the date of change means you accept it. New York law applies.`,
      "Questions about this agreement: hello@vigilstudios.co.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container narrow>
          <SectionIntro eyebrow="Service agreement" title="The terms every Vigil website runs under." lead={`Plain language, no surprises: what you are buying, what you own, how to leave. Effective ${EFFECTIVE}.`} />
          <div className="mt-12 space-y-10">
            {SECTIONS.map((s) => (
              <section key={s.title} id={s.title.split(".")[0]}>
                <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                <div className="mt-3 space-y-3 text-[15px] leading-7 text-[color:var(--text-secondary)]">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-14 border-t border-[color:var(--border)] pt-6 text-sm leading-6 text-[color:var(--text-secondary)]">
            Prices, plan inclusions and revision rounds are on the <Link href="/pricing" className="font-medium text-[color:var(--accent)]">pricing page</Link>. If anything here is unclear, ask before you buy: hello@vigilstudios.co.
          </p>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
