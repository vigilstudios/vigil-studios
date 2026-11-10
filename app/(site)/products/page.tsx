import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, LayoutDashboard, Monitor, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
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
            <div>
              <p className={styles.marker}>Vigil Studios / Products</p>
              <h1 className={styles.title}>Websites and the tools to run them</h1>
              <p className={styles.lead}>We build your website, then give you a dashboard for inquiries, bookings, and ongoing care.</p>
              <div className={styles.actions}>
                <PrimaryLink href="/find-your-fit" className="gap-2">Find your website fit <ArrowRight size={16} aria-hidden /></PrimaryLink>
                <a href="#websites" className={styles.textLink}>See the packages <ArrowDown size={15} aria-hidden /></a>
              </div>
            </div>
            <figure>
              <div className={styles.window}>
                <div className={styles.windowBar}>
                  <Monitor size={15} aria-hidden />
                  <span className={styles.label}>Restaurant website</span>
                  <span className={styles.label}>Express</span>
                </div>
                <div className={styles.previewImage}>
                  <Image src="/express-templates/previews/restaurant.jpg" alt="Marlow and Fen, an Express restaurant design with burgundy type and a photograph of a cup of coffee" fill sizes="(max-width: 767px) 90vw, 540px" />
                </div>
              </div>
              <figcaption className={styles.previewCaption}>
                <span className={styles.label}>From the design library</span>
                <Link href="/express" className={styles.textLink}>Browse Express designs <ArrowUpRight size={15} aria-hidden /></Link>
              </figcaption>
            </figure>
          </div>
        </header>

        <section id="websites" className={styles.band} aria-labelledby="website-builds-title">
          <div className={styles.wrap}>
            <div className={styles.bandIntro}>
              <div>
                <p className={styles.marker}>01 / One-time build</p>
                <h2 id="website-builds-title" className={styles.heading}>Choose your website</h2>
              </div>
              <p className={styles.body}>Every build is tailored to your brand. The right package depends on how much of the design and functionality needs to be made for you.</p>
            </div>
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
          </div>
        </section>

        <section id="workspace" className={styles.band} aria-labelledby="products-workspace-title">
          <div className={styles.wrap}>
            <div className={styles.bandIntro}>
              <div>
                <p className={styles.marker}>02 / Ongoing service</p>
                <h2 id="products-workspace-title" className={styles.heading}>After your website goes live</h2>
              </div>
              <p className={styles.body}>Every Vigil-hosted website needs a separate recurring plan. Hosting, domain connection, and security are managed for you. Additional tools and updates depend on your plan and setup.</p>
            </div>
            <div className={styles.serviceRows}>
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
            </div>
          </div>
        </section>
        <FieldGuideClose />
      </div>
      <Footer />
    </>
  );
}
