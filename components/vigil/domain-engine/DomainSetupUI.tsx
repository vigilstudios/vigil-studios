import { ArrowRight, Check, Clock3, Globe2, LockKeyhole, Mail, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./domain-workspace.module.css";

export function DomainIntro({
  heading = "Choose your website address",
  titleLevel = 2,
}: {
  heading?: string;
  titleLevel?: 1 | 2;
}) {
  const Title = titleLevel === 1 ? "h1" : "h2";
  return (
    <header className={styles.intro}>
      <div>
        <span className={styles.eyebrow}>
          <Globe2 size={14} aria-hidden="true" /> YOUR WEBSITE ADDRESS
        </span>
        <Title tabIndex={-1}>{heading}</Title>
        <p>
          A domain is your website’s address. It’s the name people type to find
          you online.
        </p>
      </div>
      <div
        className={styles.addressExample}
        aria-label="Example website address: yourbusiness.com"
      >
        <div className={styles.browserDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div>
          <LockKeyhole size={15} aria-hidden="true" />
          <span>
            yourbusiness<span>.com</span>
          </span>
        </div>
        <span className={styles.exampleCaption}>
          Your name. Your place online.
        </span>
      </div>
    </header>
  );
}

export function DomainSectionHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.icon}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <h3 tabIndex={-1}>{title}</h3>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}

export function DomainSetupSteps({ current }: { current: number }) {
  return (
    <ol className={styles.steps} aria-label="Domain setup steps">
      {[
        "Choose address",
        "Your details",
        "Review & pay",
        "Verify email",
      ].map((label, index) => (
        <li
          key={label}
          aria-current={index === current ? "step" : undefined}
          data-complete={index < current}
        >
          <span aria-hidden="true">
            {index < current ? <Check size={13} /> : index + 1}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}


export function DomainReadyHandoff({ simulation, automaticConnection, staffNotified }: {
  simulation: boolean;
  automaticConnection: boolean;
  staffNotified: boolean;
}) {
  return (
    <div className={styles.handoff}>
      <div>
        <Mail size={18} aria-hidden="true" />
        <span>
          <strong>{simulation ? "Vigil notification simulated" : staffNotified ? "Vigil has been notified" : "Your setup is saved"}</strong>
          <p>{simulation
            ? "In the live flow, Vigil receives an alert that your domain is ready for launch."
            : staffNotified
              ? "Your team knows the domain is ready. You can keep reviewing your website together."
              : "Vigil will review your domain setup alongside your website."}</p>
        </span>
      </div>
      <div>
        <Clock3 size={18} aria-hidden="true" />
        <span>
          <strong>We’ll take it from here</strong>
          <p>{!simulation && !automaticConnection
            ? "Vigil will help prepare the connection for your approved launch. Your website preview stays available."
            : "Your domain will connect automatically when Vigil deploys your finished, approved website. No launch action is needed here."}</p>
        </span>
      </div>
      {!simulation ? (
        <a className={styles.secondary} href="/dashboard/website">
          Back to website preview<ArrowRight size={15} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
