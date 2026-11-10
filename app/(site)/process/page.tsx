import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
import { ProcessStageArt } from "@/components/site/ProcessStageArt";
import { journeyStages } from "@/components/site/journey-stages";
import styles from "@/components/site/field-guide.module.css";

export const metadata: Metadata = {
  title: "How it works | Vigil Studios",
  description: "From choosing your first website through launch, inquiries, bookings, and ongoing care. See what you do and what Vigil handles.",
  alternates: { canonical: "/process" },
};

const firstSteps = [
  { title: "Choose a build and plan.", body: "The build is a one-time fee. Your Vigil plan covers hosting and any ongoing services you select." },
  { title: "Verify your email and pay.", body: "Review your order in your account, then pay through secure checkout. You can also open a free account while you decide." },
  { title: "Send us your brief.", body: "Open your dashboard after payment. Guided setup collects your business details, photos, and domain so we can start the build." },
];

const groups = [
  { label: "01–02 / Build and publish", title: "Get your website online", stages: journeyStages.slice(0, 2) },
  { label: "03–05 / After launch", title: "Run it with Vigil", stages: journeyStages.slice(2) },
];

export default function ProcessPage() {
  return (
    <>
      <div className={styles.page}>
        <header className={styles.masthead}>
          <div className={styles.wrap}>
            <p className={styles.marker}>How it works</p>
            <h1 className={styles.title}>Building and running your website</h1>
            <p className={styles.lead}>See when we need your input, what we handle, and how you’ll use your dashboard once customers start coming to your site.</p>
            <nav aria-label="Jump to a process stage">
              <ol className={styles.stageIndex}>
                {journeyStages.map(({ name, id, icon: Icon }, index) => (
                  <li key={name}>
                    <a href={`#${id}`}>
                      <span className={styles.label} aria-hidden>0{index + 1}</span>
                      <Icon size={16} aria-hidden />
                      {name}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </header>

        <div className={`${styles.wrap} pb-10 sm:pb-16`}>
          {groups.map(({ label, title, stages }) => (
            <section key={title} className={styles.stageGroup} aria-label={title}>
              <p className={styles.marker}>{label}</p>
              <h2 className={styles.heading}>{title}</h2>
              {stages.map(({ name, id, label: stageLabel, title: heading, body, href, link }) => (
                <article key={name} id={id} tabIndex={-1} className={styles.stage} aria-labelledby={`${id}-title`}>
                  <div className={styles.stageCopy}>
                    <p className={styles.marker}>{stageLabel}</p>
                    <h3 id={`${id}-title`} className={styles.subhead}>{heading}</h3>
                    <p className={styles.body}>{name === "Build" ? "We design your site around the business details you share. You’ll get a preview in your dashboard to review before it goes live." : body}</p>
                    {name === "Build" && (
                      <ol className={`${styles.checklist} ${styles.body}`}>
                        {firstSteps.map(({ title, body }) => <li key={title}><strong>{title}</strong> {body}</li>)}
                      </ol>
                    )}
                    <Link href={href} className={styles.textLink}>{link} <ArrowRight size={15} aria-hidden /></Link>
                  </div>
                  <ProcessStageArt stage={name} />
                </article>
              ))}
              {stages[0].name === "Build" && <a href="#process-respond" className={styles.textLink}>Jump to what happens after launch <ArrowDown size={15} aria-hidden /></a>}
            </section>
          ))}
        </div>
        <FieldGuideClose />
      </div>
      <Footer />
    </>
  );
}
