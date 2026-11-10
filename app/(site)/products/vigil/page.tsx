import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Circle, CreditCard, Download, Globe, Inbox, LineChart, PencilLine, Shield, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
import { WorkspaceFeatures } from "@/components/site/WorkspaceFeatures";
import { PrimaryLink } from "@/components/site/primitives";
import { planBullets } from "@/lib/vigil/plan-presentation";
import { PLAN_COPY } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import styles from "@/components/site/field-guide.module.css";

export const metadata: Metadata = {
  title: "The Vigil platform | Vigil Studios",
  description: "Manage website inquiries, bookings, reports, updates, hosting, and billing with Vigil.",
  alternates: { canonical: "/products/vigil" },
};

const managed = [
  { icon: Globe, title: "Hosting and domain connection", body: "We publish and monitor your site, help connect your existing domain, or register one in your name." },
  { icon: Shield, title: "SSL and security", body: "We handle certificates, renewals, and platform maintenance so your site stays secure." },
  { icon: CreditCard, title: "Plan and billing", body: "See your plan, get invoices, and manage your payment details in your account." },
  { icon: Download, title: "Website ownership", body: "Your site’s code and content are yours. Download a copy from your dashboard." },
];

const sample = [
  { href: "#lead-hub", icon: Inbox, item: "Private dining inquiry", feature: "Lead Hub", status: "New" },
  { href: "#bookings", icon: CalendarDays, item: "Table for two · 7:30 pm", feature: "Bookings", status: "Confirmed" },
  { href: "#overview", icon: LineChart, item: "Traffic and inquiry report", feature: "Overview", status: "Last 30 days" },
  { href: "#content-hub", icon: PencilLine, item: "Dinner menu update", feature: "Content Hub", status: "Draft" },
];

export default async function VigilPage() {
  const { plans } = await getPublicPricing();

  return (
    <>
      <div className={styles.page}>
        <header className={styles.masthead}>
          <div className={`${styles.wrap} ${styles.heroSplit}`}>
            <div>
              <p className={styles.marker}><Link href="/products" className="hover:underline">Products</Link> / Vigil</p>
              <h1 className={styles.title}>Run your website with Vigil</h1>
              <p className={styles.lead}>See who reached out, what’s booked, and how your site is doing. We handle the hosting and maintenance behind it.</p>
              <div className={styles.actions}>
                <PrimaryLink href="/pricing?tab=subscriptions" className="gap-2">Compare Vigil plans <ArrowRight size={16} aria-hidden /></PrimaryLink>
                <a href="#workspace" className={styles.textLink}>Explore the dashboard <ArrowDown size={15} aria-hidden /></a>
              </div>
            </div>
            <div className={styles.window} aria-label="Example activity from the Vigil dashboard">
              <div className={styles.windowBar}>
                <span className={styles.label}>Vigil / Overview</span>
                <span className={styles.label}>Sample workspace</span>
              </div>
              <div className={styles.sample}>
                <div className={styles.sampleHeading}>
                  <strong>Marlow &amp; Fen</strong>
                  <span className={styles.sampleStatus}><Circle size={7} fill="currentColor" aria-hidden /> Website live</span>
                </div>
                <ul>
                  {sample.map(({ href, icon: Icon, item, feature, status }) => (
                    <li key={href}>
                      <a href={href} className={styles.sampleRow}>
                        <Icon size={17} aria-hidden />
                        <span><strong>{item}</strong><small>{feature}</small></span>
                        <span className={styles.label}>{status}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </header>

        <WorkspaceFeatures />

        <section id="outcomes" className={styles.band} aria-labelledby="vigil-managed-title">
          <div className={styles.wrap}>
            <div className={styles.bandIntro}>
              <div>
                <p className={styles.marker}>Managed service</p>
                <h2 id="vigil-managed-title" className={styles.heading}>What we take care of</h2>
              </div>
              <p className={styles.body}>Vigil looks after your site’s infrastructure. Your dashboard shows its status and anything that needs your attention.</p>
            </div>
            <dl className={styles.managed}>
              {managed.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <dt><Icon size={17} aria-hidden /> {title}</dt>
                  <dd className={styles.body}>{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="plans" className={styles.band} aria-labelledby="vigil-plans-title">
          <div className={styles.wrap}>
            <div className={styles.bandIntro}>
              <div>
                <p className={styles.marker}>Subscriptions</p>
                <h2 id="vigil-plans-title" className={styles.heading}>Choose the support you need</h2>
              </div>
              <p className={styles.body}>A Vigil plan is billed separately from your website build. Basic covers managed hosting. Care and higher add change requests and optional Bookings on compatible sites.</p>
            </div>
            {plans.length > 0 && (
              <ul className={styles.catalog}>
                {plans.map((plan) => {
                  const features = planBullets(plan.includes);
                  return (
                    <li key={plan.code} className={styles.catalogRow}>
                      <div>
                        <h3 className={styles.subhead}>{plan.name}</h3>
                      </div>
                      <div className={styles.body}>
                        <p>{PLAN_COPY[plan.code]?.headline ?? plan.tagline}</p>
                        {features.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
                      </div>
                      <div className={styles.catalogEnd}>
                        {plan.prices.month != null && <strong>{formatMoney(plan.prices.month, plan.currency).replace(/\.00$/, "")} / month</strong>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.actions}>
              <Link href="/pricing?tab=subscriptions" className={styles.textLink}>Compare plan features and billing periods <ArrowRight size={15} aria-hidden /></Link>
            </div>
            <div className={`${styles.serviceRows} mt-6`}>
              <article className={styles.serviceRow}>
                <Sparkles size={19} aria-hidden />
                <h3 className={styles.subhead}>Virtue</h3>
                <p className={styles.body}>Virtue guides setup on every plan. Lead follow-up, missed-call text-back, and reviews are in development for eligible Growth and Priority subscriptions.</p>
                <Link href="/products/virtue" className={styles.textLink}>Meet Virtue <ArrowUpRight size={15} aria-hidden /></Link>
              </article>
            </div>
          </div>
        </section>
        <FieldGuideClose />
      </div>
      <Footer />
    </>
  );
}
