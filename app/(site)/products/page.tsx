import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, LayoutDashboard, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
import { Reveal } from "@/components/site/Reveal";
import Hub from "@/components/ui/hub";
import { PrimaryLink } from "@/components/site/primitives";
import { START, WEBSITE_PACKAGE_LINKS } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import styles from "@/components/site/field-guide.module.css";

export const metadata: Metadata = {
  title: "Products | Vigil Studios",
  description: "Explore Vigil website packages, managed care, Lead Hub, Bookings, reporting, and guided setup.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const { builds } = await getPublicPricing();
  const packageNotes = {
    express: `First look ${WEBSITE_TIERS.express.firstLook.toLowerCase()}.`,
    professional: `Up to ${WEBSITE_TIERS.professional.primaryPages} primary pages and ${WEBSITE_TIERS.professional.revisions} revision rounds.`,
    custom: "Written scope, price, and timeline.",
  };

  return (
    <>
      <div className={styles.page}>
        <header className={styles.masthead}>
          <div className={`${styles.wrap} ${styles.heroSplit}`}>
            <Reveal className={styles.fade}>
              <p className={styles.marker}>Vigil Studios / Products</p>
              <h1 className={styles.title}>Websites and the tools to run them</h1>
              <p className={styles.lead}>We build your website, then give you a dashboard for inquiries, bookings, and ongoing care.</p>
              <div className={styles.actions}>
                <PrimaryLink href="/find-your-fit" className="gap-2">Find your website fit <ArrowRight size={16} aria-hidden /></PrimaryLink>
                <a href="#websites" className={styles.textLink}>See the packages <ArrowDown size={15} aria-hidden /></a>
              </div>
            </Reveal>
            <Reveal className={styles.fade} delay={0.1}>
              <figure>
                <div className={styles.hub}>
                  <Hub play label="Vigil connects your website, inquiries, bookings, and ongoing care" />
                  {/* The center tile is fixed in Hairline 0.5.1’s 400 × 320 projection. */}
                  <svg className={styles.hubMark} viewBox="0 0 400 320" aria-hidden="true">
                    <defs>
                      <mask id="products-vigil-mark" x="-6" y="-5" width="12" height="10" maskUnits="userSpaceOnUse">
                        <image href="/vigil-vstar-white.svg" x="-5.75" y="-4.5" width="11.5" height="9" />
                      </mask>
                    </defs>
                    <g transform="matrix(1.2445 .62225 -1.2445 .62225 200 169.66)">
                      <rect x="-6" y="-5" width="12" height="10" mask="url(#products-vigil-mark)" fill="var(--guide-accent)" />
                    </g>
                  </svg>
                </div>
                <figcaption className={`${styles.label} ${styles.hubCaption}`}>The Vigil platform</figcaption>
              </figure>
            </Reveal>
          </div>
        </header>

        <section id="websites" className={styles.band} aria-labelledby="website-builds-title">
          <div className={styles.wrap}>
            <Reveal className={`${styles.bandIntro} ${styles.fade}`}>
              <div>
                <p className={styles.marker}>01 / One-time build</p>
                <h2 id="website-builds-title" className={styles.heading}>Choose your website</h2>
              </div>
              <p className={styles.body}>Every build is tailored to your brand. The right package depends on how much of the design and functionality needs to be made for you.</p>
            </Reveal>
            <Reveal className={styles.fade} delay={0.1}>
              <ul className={styles.catalog}>
                {builds.map((build) => {
                  const tier = WEBSITE_TIERS[build.kind];
                  const link = WEBSITE_PACKAGE_LINKS[build.kind];
                  return (
                    <li key={tier.kind} className={styles.catalogRow}>
                      <div>
                        <p className={styles.label}>{START.stages[tier.kind].stage}</p>
                        <h3 className={styles.subhead}>{build.name}</h3>
                      </div>
                      <div className={styles.body}>
                        <p>{tier.summary}</p>
                        <p>{packageNotes[tier.kind]}</p>
                      </div>
                      <div className={styles.catalogEnd}>
                        {build.amountCents != null
                          ? <strong>{formatMoney(build.amountCents, build.currency).replace(/\.00$/, "")} one-time</strong>
                          : tier.kind === "custom" && <strong>Quoted after a call</strong>}
                        <Link href={link.href} className={styles.textLink}>{link.label} <ArrowUpRight size={15} aria-hidden /></Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className={styles.actions}>
                <Link href="/products/websites" className={styles.textLink}>Compare website packages <ArrowRight size={15} aria-hidden /></Link>
                <Link href="/pricing" className={styles.textLink}>See build and plan pricing <ArrowRight size={15} aria-hidden /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="workspace" className={styles.band} aria-labelledby="products-workspace-title">
          <div className={styles.wrap}>
            <Reveal className={`${styles.bandIntro} ${styles.fade}`}>
              <div>
                <p className={styles.marker}>02 / Ongoing service</p>
                <h2 id="products-workspace-title" className={styles.heading}>After your website goes live</h2>
              </div>
              <p className={styles.body}>Every Vigil-hosted website needs a separate recurring plan. Hosting, domain connection, and security are managed for you. Additional tools and updates depend on your plan and setup.</p>
            </Reveal>
            <Reveal className={`${styles.serviceRows} ${styles.fade}`} delay={0.1}>
              <article id="vigil" className={styles.serviceRow}>
                <LayoutDashboard size={19} aria-hidden />
                <h3 className={styles.subhead}>Vigil</h3>
                <p className={styles.body}>The dashboard and team behind your site. Follow up on new inquiries, manage bookings on eligible sites, and see how your site is doing.</p>
                <Link href="/products/vigil" className={styles.textLink}>Explore Vigil <ArrowUpRight size={15} aria-hidden /></Link>
              </article>
              <article className={styles.serviceRow}>
                <Sparkles size={19} aria-hidden />
                <h3 className={styles.subhead}>Virtue</h3>
                <p className={styles.body}>Guided setup collects the details we need to build your site. Ongoing lead follow-up, missed-call text-back, and reviews are in development for eligible Growth and Priority plans.</p>
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
