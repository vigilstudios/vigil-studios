import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CreditCard, Download, Globe, Minus, Shield, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
import { WorkspaceFeatures } from "@/components/site/WorkspaceFeatures";
import { PrimaryLink } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { VigilWorkspacePreview } from "@/components/site/VigilWorkspacePreview";
import { PLAN_FEATURE_LABELS } from "@/lib/vigil/plan-presentation";
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

export default async function VigilPage() {
  const { plans } = await getPublicPricing();

  return (
    <>
      <div className={styles.page}>
        <header className={styles.masthead}>
          <div className={`${styles.wrap} ${styles.heroSplit}`}>
            <Reveal className={styles.fade}>
              <p className={styles.marker}><Link href="/products" className="hover:underline">Products</Link> / Vigil</p>
              <h1 className={styles.title}>Run your website with Vigil</h1>
              <p className={styles.lead}>See who reached out, what’s booked, and how your site is doing. We handle the hosting and maintenance behind it.</p>
              <div className={styles.actions}>
                <PrimaryLink href="/pricing?tab=subscriptions" className="gap-2">Compare Vigil plans <ArrowRight size={16} aria-hidden /></PrimaryLink>
                <a href="#workspace" className={styles.textLink}>Explore the dashboard <ArrowDown size={15} aria-hidden /></a>
              </div>
            </Reveal>
            <Reveal className={styles.fade} delay={0.1}>
              <VigilWorkspacePreview />
            </Reveal>
          </div>
        </header>

        <WorkspaceFeatures />

        <section id="outcomes" className={styles.band} aria-labelledby="vigil-managed-title">
          <div className={styles.wrap}>
            <Reveal className={`${styles.bandIntro} ${styles.fade}`}>
              <div>
                <p className={styles.marker}>Managed service</p>
                <h2 id="vigil-managed-title" className={styles.heading}>What we take care of</h2>
              </div>
              <p className={styles.body}>Vigil looks after your site’s infrastructure. Your dashboard shows its status and anything that needs your attention.</p>
            </Reveal>
            <Reveal className={styles.fade} delay={0.1}>
              <dl className={styles.managed}>
                {managed.map(({ icon: Icon, title, body }) => (
                  <div key={title}>
                    <dt><Icon size={17} aria-hidden /> {title}</dt>
                    <dd className={styles.body}>{body}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <section id="plans" className={styles.band} aria-labelledby="vigil-plans-title">
          <div className={styles.wrap}>
            <Reveal className={`${styles.bandIntro} ${styles.fade}`}>
              <div>
                <p className={styles.marker}>Subscriptions</p>
                <h2 id="vigil-plans-title" className={styles.heading}>Choose the support you need</h2>
              </div>
              <p className={styles.body}>A Vigil plan is billed separately from your website build. Basic covers managed hosting. Care and higher add change requests and optional Bookings on compatible sites.</p>
            </Reveal>
            {plans.length > 0 && (
              <Reveal className={styles.fade} delay={0.1}>
                <p className={`${styles.label} ${styles.tableHint}`}>Scroll to compare plans <ArrowRight size={13} aria-hidden /></p>
                <div className={styles.planScroll} tabIndex={0} role="region" aria-label="Compare Vigil subscriptions">
                  <table className={styles.planMatrix}>
                    <caption className="sr-only">Vigil subscription prices and features</caption>
                    <thead>
                      <tr>
                        <th scope="col" className={styles.label}>Included features</th>
                        {plans.map((plan) => (
                          <th key={plan.code} scope="col">
                            <span className={styles.planName}>{plan.name}</span>
                            {plan.prices.month != null && <span className={styles.body}>{formatMoney(plan.prices.month, plan.currency).replace(/\.00$/, "")} / month</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PLAN_FEATURE_LABELS.map(([code, label]) => (
                        <tr key={code}>
                          <th scope="row">{label}</th>
                          {plans.map((plan) => (
                            <td key={plan.code}>
                              {plan.includes.some((feature) => feature.code === code && feature.on)
                                ? <><Check size={18} className={styles.planCheck} aria-hidden /><span className="sr-only">Included</span></>
                                : <><Minus size={16} aria-hidden /><span className="sr-only">Not included</span></>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            )}
            <div className={styles.actions}>
              <Link href="/pricing?tab=subscriptions" className={styles.textLink}>Compare plan features and billing periods <ArrowRight size={15} aria-hidden /></Link>
            </div>
            <Reveal className={`${styles.serviceRows} ${styles.fade} mt-10`}>
              <article className={styles.serviceRow}>
                <Sparkles size={19} aria-hidden />
                <h3 className={styles.subhead}>Virtue</h3>
                <p className={styles.body}>Virtue guides setup on every plan. Lead follow-up, missed-call text-back, and reviews are in development for eligible Growth and Priority subscriptions.</p>
                <Link href="/products/virtue" className={styles.textLink}>Meet Virtue <ArrowUpRight size={15} aria-hidden /></Link>
              </article>
            </Reveal>
          </div>
        </section>
        <FieldGuideClose />
      </div>
      <Footer />
    </>
  );
}
