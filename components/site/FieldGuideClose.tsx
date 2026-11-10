import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { EmailLink } from "@/components/site/Email";
import { PrimaryLink } from "@/components/site/primitives";
import { GET_STARTED } from "@/lib/site-copy";
import styles from "./field-guide.module.css";

export function FieldGuideClose() {
  return (
    <section id="get-started" className={styles.close} aria-labelledby="next-step-title">
      <div className={`${styles.wrap} ${styles.heroSplit}`}>
        <div>
          <p className={styles.marker}>Get started</p>
          <h2 id="next-step-title" className={styles.heading}>Find the right website for you.</h2>
          <p className={styles.body}>Compare options on your own, or talk through your project with us.</p>
        </div>
        <div className={styles.actions}>
          <PrimaryLink href={GET_STARTED.primary.href} className="gap-2">
            {GET_STARTED.primary.label} <ArrowRight size={16} aria-hidden />
          </PrimaryLink>
          <CalendlyPopup className={styles.textLink}>{GET_STARTED.call}</CalendlyPopup>
          <EmailLink className={styles.textLink} label={GET_STARTED.emailLabel} />
        </div>
      </div>
    </section>
  );
}
