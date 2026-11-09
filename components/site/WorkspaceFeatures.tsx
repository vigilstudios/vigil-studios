import Link from "next/link";
import { ArrowUpRight, CalendarDays, LineChart, Inbox, PencilLine } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import styles from "./client-journey.module.css";

const features = [
  {
    id: "lead-hub", icon: Inbox, label: "01 / Inquiries", title: "Lead Hub",
    body: "See messages from connected website forms, mark what needs attention, and keep a record of your follow-up. Reply through your preferred email workflow and set where inquiry notifications go.",
    availability: "For connected website contact forms",
  },
  {
    id: "bookings", icon: CalendarDays, label: "02 / Scheduling", title: "Bookings",
    body: "Offer appointments or table reservations on a compatible site. Manage requests, confirmations, and availability in Vigil. You can optionally copy appointments to a dedicated Google Calendar.",
    availability: "Care and above · setup and activation required",
  },
  {
    id: "overview", icon: LineChart, label: "03 / Reporting", title: "Overview",
    body: "Check traffic, inquiry activity, speed, search visibility, and security from your dashboard. Connected reports show when the data was collected, so you can tell what’s current.",
    availability: "Reporting varies with connected sources",
  },
  {
    id: "content-hub", icon: PencilLine, label: "04 / Updates", title: "Content Hub & requests",
    body: "Ask the Vigil team to make changes, or update enabled content such as services, menus, and posts yourself when your site is configured for Content Hub.",
    availability: "Care and above · self-service on eligible Professional and Growth sites",
  },
] as const;

export function WorkspaceFeatures({ detail = false }: { detail?: boolean }) {
  return (
    <Section id="workspace" className={styles.workspace}>
      <Container>
        <div className={styles.intro}>
          <div>
            <p className={styles.kicker}>Inside the dashboard</p>
            <h2>Run the business<br className={styles.wideBreak} /> <em>behind the site.</em></h2>
          </div>
          <p>See what needs your attention, keep track of customers, and give the Vigil team changes to make. Your workspace grows with the tools you use.</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map(({ id, icon: Icon, label, title, body, availability }) => (
            <article key={id} id={detail ? id : undefined} className={styles.feature}>
              <div className={styles.featureHeader}><Icon size={22} aria-hidden /><span>{label}</span></div>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className={styles.featureFoot}>
                <span>{availability}</span>
                {!detail && <Link href={`/products/vigil#${id}`} aria-label={`Explore ${title}`}><ArrowUpRight size={18} aria-hidden /></Link>}
              </div>
            </article>
          ))}
        </div>
        {detail && (
          <p className={styles.featureNote}>
            <Link href="/pricing?tab=subscriptions">Compare Vigil plans <ArrowUpRight size={15} aria-hidden /></Link>
            <Link href="/calendar-privacy">Calendar connection privacy <ArrowUpRight size={15} aria-hidden /></Link>
          </p>
        )}
      </Container>
    </Section>
  );
}
