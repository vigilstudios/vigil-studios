import Link from "next/link";
import { ArrowUpRight, CalendarDays, LineChart, Inbox, Package, PencilLine } from "lucide-react";
import { Reveal } from "./Reveal";
import styles from "./field-guide.module.css";

const features = [
  {
    id: "overview", icon: LineChart, label: "01 / Overview", title: "Overview",
    body: "Check traffic, inquiry activity, speed, search visibility, and security. Connected reports show when the data was collected, so you can see how current it is.",
    availability: "Reports depend on connected sources",
  },
  {
    id: "lead-hub", icon: Inbox, label: "02 / Customer activity", title: "Lead Hub",
    body: "Read messages from connected website forms, reply by email, and keep a record of follow-up. Add internal notes, update the inquiry status, and choose who gets notified when a message comes in.",
    availability: "For connected website contact forms",
  },
  {
    id: "bookings", icon: CalendarDays, label: "02 / Customer activity", title: "Bookings",
    body: "Take appointments or table reservations from a compatible site. Set your hours, review requests, and manage confirmations in Vigil. You can also copy appointments to a dedicated Google Calendar.",
    availability: "Care and above · setup and activation required",
  },
  {
    id: "products", icon: Package, label: "03 / Your collection", title: "Products",
    body: "Manage your catalog from Vigil: add product images and descriptions, organize categories, update price labels, and prepare drafts before publishing to your connected website. Products Lite covers your native catalog; eligible Commerce Pro setups can expand into connected commerce as integrations roll out.",
    availability: "Products Lite and Commerce Pro depend on your website package and subscription",
  },
  {
    id: "content-hub", icon: PencilLine, label: "04 / Updates", title: "Content Hub and requests",
    body: "Send the Vigil team a change request with a note and any files. On eligible sites, Content Hub lets you edit, save, and publish supported content such as services, menus, or posts yourself.",
    availability: "Care and above · Content Hub on eligible Professional and Growth sites",
  },
] as const;

export function WorkspaceFeatures() {
  return (
    <section id="workspace" className={styles.band} aria-labelledby="vigil-workspace-title">
      <div className={styles.wrap}>
        <Reveal className={`${styles.bandIntro} ${styles.fade}`}>
          <div>
            <p className={styles.marker}>Your dashboard</p>
            <h2 id="vigil-workspace-title" className={styles.heading}>What you can do in Vigil</h2>
          </div>
          <p className={styles.body}>Follow up with customers, manage bookings and products, check your activity, and send changes to the team from the same place.</p>
        </Reveal>
        <div className={styles.featureRows}>
          {features.map(({ id, icon: Icon, label, title, body, availability }) => (
            <article key={id} id={id} tabIndex={-1} className={styles.featureRow} aria-labelledby={`${id}-title`}>
              <Reveal className={styles.fade}>
                <p className={styles.marker}>{label}</p>
                <h3 id={`${id}-title`} className={styles.subhead}><Icon size={18} aria-hidden /> {title}</h3>
              </Reveal>
              <Reveal className={styles.fade} delay={0.08}>
                <p className={styles.body}>{body}</p>
                <p className={styles.label}>{availability}</p>
                {id === "products" && <Link href="#product-plans" className={styles.textLink}>Compare product capabilities <ArrowUpRight size={14} aria-hidden /></Link>}
                {id === "bookings" && <Link href="/calendar-privacy" className={styles.textLink}>Calendar privacy <ArrowUpRight size={14} aria-hidden /></Link>}
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
