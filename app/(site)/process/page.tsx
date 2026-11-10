import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FieldGuideClose } from "@/components/site/FieldGuideClose";
import { ProcessStageArt } from "@/components/site/ProcessStageArt";
import { Reveal } from "@/components/site/Reveal";
import { journeyStages } from "@/components/site/journey-stages";
import styles from "@/components/site/field-guide.module.css";

export const metadata: Metadata = {
  title: "How it works | Vigil Studios",
  description: "See how to choose your website, share your brief, review your design, and get your site online with Vigil.",
  alternates: { canonical: "/process" },
};

const firstSteps = [
  { title: "Choose a build and plan.", body: "The build is a one-time fee. Your Vigil plan covers hosting and any ongoing services you select." },
  { title: "Verify your email and pay.", body: "Review your order in your account, then pay through secure checkout. You can also open a free account while you decide." },
  { title: "Send us your brief.", body: "Open your dashboard after payment. Guided setup collects your business details, photos, and domain so we can start the build." },
];

const stages = journeyStages.slice(0, 2);

export default function ProcessPage() {
  return (
    <>
      <div className={`${styles.page} ${styles.processPage}`}>
        <header className={styles.masthead}>
          <div className={styles.wrap}>
            <Reveal className={styles.fade}>
              <p className={styles.marker}>How it works</p>
              <h1 className={styles.title}>From first brief to launch</h1>
              <p className={styles.lead}>See what we need from you, when you’ll review your website, and how we’ll get it online.</p>
            </Reveal>
            <Reveal className={styles.fade} delay={0.1}>
              <nav aria-label="Jump to a process stage">
                <ol className={styles.stageIndex}>
                  {stages.map(({ name, id, icon: Icon }, index) => (
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
            </Reveal>
          </div>
        </header>

        <section className={`${styles.wrap} ${styles.stageGroup} pb-14 sm:pb-24`} aria-labelledby="build-and-publish">
          <Reveal className={styles.fade}>
            <h2 id="build-and-publish" className={styles.heading}>Build and publish</h2>
          </Reveal>
          {stages.map(({ name, id, label, title, body, href, link }) => (
            <article key={name} id={id} tabIndex={-1} className={styles.stage} aria-labelledby={`${id}-title`}>
              <Reveal className={`${styles.stageCopy} ${styles.fade}`}>
                <p className={styles.marker}>{label}</p>
                <h3 id={`${id}-title`} className={styles.subhead}>{title}</h3>
                <p className={styles.body}>{name === "Build" ? "We design your site around the business details you share. You’ll get a preview in your dashboard to review before it goes live." : body}</p>
                {name === "Build" && (
                  <ol className={`${styles.checklist} ${styles.body}`}>
                    {firstSteps.map(({ title, body }) => <li key={title}><strong>{title}</strong> {body}</li>)}
                  </ol>
                )}
                <Link href={href} className={styles.textLink}>{link} <ArrowRight size={15} aria-hidden /></Link>
              </Reveal>
              <Reveal className={styles.fade} delay={0.1}><ProcessStageArt stage={name} /></Reveal>
            </article>
          ))}
        </section>
        <FieldGuideClose />
      </div>
      <Footer />
    </>
  );
}
