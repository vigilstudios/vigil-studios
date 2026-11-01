import Link from "next/link";
import { ArrowRight, Search, Link2, CircleHelp } from "lucide-react";
import styles from "@/components/vigil/domain-engine/domain-workspace.module.css";

/** Only the selected path opens a setup form. */
export function DomainOptions({
  canFind,
  canSetUp,
  savedName,
  managedPurchasing = false,
}: {
  managedPurchasing?: boolean;
  canFind: boolean;
  canSetUp: boolean;
  savedName?: string;
}) {
  const options = [
    {
      title: "Find a new address",
      label: "Find your domain",
      description: savedName
        ? `Continue with ${savedName}, or find a new name.`
        : managedPurchasing
          ? "Choose a name for your business. Register and pay right here in Vigil."
          : "Find your name. We’ll guide you through buying it with Vercel.",
      action: "Find my address",
      href: "/dashboard/domain?flow=find",
      icon: Search,
      enabled: canFind,
    },
    {
      title: "Use an address I own",
      label: "Already own one",
      description:
        "Use your existing web address. Keep it with your provider and connect it to your website.",
      action: "Use my address",
      href: "/dashboard/domain?flow=own",
      icon: Link2,
      enabled: canSetUp,
    },
  ];
  return (
    <>
      <nav aria-label="Domain setup options" className={styles.choices}>
        {options.map(
          ({
            title,
            label,
            description,
            action,
            href,
            icon: Icon,
            enabled,
          }) => {
            const content = (
              <>
                <span className={styles.icon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className={styles.choiceTitle}>{title}</span>
                <span className={styles.choiceDescription}>{description}</span>
                <span className={styles.link}>
                  {enabled
                    ? action
                    : canSetUp
                      ? "Search is temporarily unavailable"
                      : "Your website setup is being prepared"}
                  {enabled ? <ArrowRight size={16} aria-hidden="true" /> : null}
                </span>
              </>
            );
            return enabled ? (
              <Link
                key={title}
                href={href}
                className={styles.choice}
                aria-label={label}
              >
                {content}
              </Link>
            ) : (
              <div key={title} aria-disabled="true" className={styles.choice}>
                {content}
              </div>
            );
          },
        )}
      </nav>
      <details className={styles.disclosure}>
        <summary>
          <CircleHelp size={16} aria-hidden="true" />
          Not sure if you have a domain?
        </summary>
        <p>
          Look for a website address you’ve purchased, such as yourbusiness.com.
          You might have a receipt from GoDaddy, Name.com, Squarespace, or
          another provider. A social media username isn’t a domain. Your preview
          stays available while you decide.
        </p>
      </details>
    </>
  );
}
