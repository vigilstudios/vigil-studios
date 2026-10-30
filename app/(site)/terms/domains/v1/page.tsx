import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { EmailText } from "@/components/site/Email";

export const metadata: Metadata = {
  title: "Domain registration terms | Vigil Studios",
  description: "Client ownership, registration, pricing, verification, manual renewal and domain records.",
  alternates: { canonical: "/terms/domains/v1" },
};

// Immutable accepted version. Publish later revisions at a new versioned URL.
const sections = [
  {
    "title": "Your domain and our role",
    "paragraphs": [
      "You authorize Vigil to register and administer the selected domain through Name.com on your behalf. You remain the domain's registered owner, using the accurate contact details you approve. If you enter an organization in the registrant details, that organization is the legal Registered Name Holder. Vigil's agency account administers the domain; you do not need a separate Name.com or Vercel account.",
      "You accept the applicable Name.com registration agreement and registry requirements when you approve a registration. You must be authorized to act for the named registrant and to use the selected domain. Availability and price are confirmed again before registration; searching or selecting a name does not reserve it."
    ]
  },
  {
    "title": "Price and payment",
    "paragraphs": [
      "Checkout shows the one-year registration cost, a one-time $5 Vigil automation fee, applicable tax, total and current renewal estimate. The initial offering is for US customers and is limited to ordinary non-premium .com domains within the published purchase limits. Hosting and website-plan charges are separate.",
      "Your card is authorized for the displayed amount. Vigil captures that amount after confirming the matching registrar registration and receipt. A confirmed failure before registration releases the authorization. If the provider's response is uncertain, Vigil investigates the original request before retrying, refunding or asking you to purchase again. A registration is not canceled merely because its payment needs assistance.",
      "Contact Vigil for a refund or correction request. The registrar's cancellation/refund rules and applicable customer rights determine what can be reversed after registration; a refund request does not itself delete or transfer a registered domain."
    ]
  },
  {
    "title": "Verify your details",
    "paragraphs": [
      "Name.com sends required verification, renewal and compliance emails to the approved contact. You must receive and complete required verification within the registrar's deadline; failure can suspend the domain. Keep your contact details current and contact Vigil promptly if verification email is missing."
    ]
  },
  {
    "title": "Connecting your website",
    "paragraphs": [
      "Registration and publishing are separate steps. You approve the exact website DNS plan before Vigil applies it through a supported provider integration. Vigil preserves unrelated records, including mail/security settings, and requires renewed approval if the saved plan changes. An existing third-party domain requires supported provider authorization or the provider's manual instructions.",
      "Website publication follows the existing Deploy Preview and approved Deploy Live process. “Registered” does not mean DNS, ownership verification, HTTPS or the website deployment is ready."
    ]
  },
  {
    "title": "Renewals, leaving and help",
    "paragraphs": [
      "The initial service uses manual renewal. There is no automatic domain-renewal card charge. Renewal prices can change; the dashboard estimate is not a guaranteed future price. Follow registrar notices and request renewal assistance from Vigil before expiration. An expired domain can stop working and recovery may cost more or be unavailable.",
      "Canceling a Vigil hosting plan does not transfer domain ownership to Vigil. You may request assistance to move or release your domain, subject to registrar identity checks, applicable locks and registry rules. Transfers, contact changes and paid renewals currently require staff assistance and a separate confirmed scope; they are not unattended operations."
    ]
  },
  {
    "title": "Records and privacy",
    "paragraphs": [
      "Vigil shares the necessary approved registrant information with Name.com to register and administer your domain, and uses Stripe for payment processing. Vigil does not store card numbers. Ownership, consent, financial and DNS evidence is access-controlled. Transaction and consent records are retained for seven years, and longer where an applicable recordkeeping obligation, active dispute, audit or legal hold requires it. Registrant contact information is maintained while Vigil manages the domain; afterward, operational information is minimized where possible while preserving necessary ownership, transaction and compliance evidence. The recordkeeping period cannot end before the applicable period measured from the relevant return due/filing date. Deletion requests are reviewed against these obligations, including active ownership, audit and dispute records. Contact Vigil with questions about your records."
    ]
  }
];

export default function DomainTermsPage() {
  return <>
    <Section className="pt-32 sm:pt-40">
      <Container narrow>
        <SectionIntro eyebrow="Domain registration · v1" title="Your domain stays yours." lead="Effective 30 October 2026. These terms supplement the Vigil service agreement for domain registrations by US customers." />
        <p className="mt-6 text-sm leading-7 text-[color:var(--text-secondary)]">Read these alongside the <Link href="/terms" className="underline">Vigil service agreement</Link> and the <a href="https://www.name.com/policies/registration-agreement" className="underline">Name.com registration agreement</a>. Registering a domain does not publish your website.</p>
        <div className="mt-12 space-y-10">
          {sections.map(section => <section key={section.title}>
            <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-7 text-[color:var(--text-secondary)]">
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>)}
        </div>
        <p className="mt-12 border-t border-[color:var(--border)] pt-6 text-sm">Domain assistance and questions: <EmailText />.</p>
      </Container>
    </Section>
    <Footer />
  </>;
}
