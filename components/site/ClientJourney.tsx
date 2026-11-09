"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, CalendarDays, Check, CircleDot, Globe2, Inbox, Layers3, LineChart, PanelsTopLeft } from "lucide-react";
import styles from "./client-journey.module.css";

const stages = [
  {
    name: "Build", icon: PanelsTopLeft, label: "01 / Project workspace",
    title: "Start with a site that fits.",
    body: "Choose a website and ongoing plan. Tell us about your business through Virtue’s guided setup, or start with a kickoff call where offered. We build it and share a preview for your review.",
    signals: [["Website package", "Selected"], ["Business details", "Ready"], ["Design preview", "In review"]],
    href: "/products/websites", link: "Compare website packages",
  },
  {
    name: "Launch", icon: Globe2, label: "02 / Website status",
    title: "Go live on your own domain.",
    body: "Approve the preview and connect your domain with our help. We publish your site and look after hosting, SSL, and platform maintenance. You can see its status in your dashboard.",
    signals: [["Design approval", "Approved"], ["Domain", "Connected"], ["Website", "Live"]],
    href: "/products/vigil#outcomes", link: "See what Vigil manages",
  },
  {
    name: "Respond", icon: Inbox, label: "03 / Lead Hub",
    title: "Give every inquiry a next step.",
    body: "When Vigil connects your website’s contact form, new inquiries land in Lead Hub. Read the message, follow up, add an internal note, and track the outcome from one place.",
    signals: [["New inquiry", "Unread"], ["Consultation request", "In progress"], ["Website inquiry", "Replied"]],
    href: "/products/vigil#lead-hub", link: "Explore Lead Hub",
  },
  {
    name: "Book", icon: CalendarDays, label: "04 / Bookings",
    title: "Turn interest into time on the calendar.",
    body: "On compatible Care and higher sites, Vigil can set up appointment scheduling or restaurant reservations. Set availability and manage requests and confirmed bookings in your dashboard.",
    signals: [["Availability", "Open"], ["Booking request", "Needs review"], ["Appointment", "Confirmed"]],
    href: "/products/vigil#bookings", link: "Explore Bookings",
  },
  {
    name: "Improve", icon: LineChart, label: "05 / Website overview",
    title: "See what’s working and keep moving.",
    body: "Overview brings connected traffic, inquiry activity, and site health into view. On Care and above, request changes from the team. Eligible Professional and Growth sites can also get self-service Content Hub editing.",
    signals: [["Traffic", "Connected"], ["Website check", "Passing"], ["Content update", "Ready"]],
    href: "/products/vigil#overview", link: "Explore reporting and care",
  },
] as const;

export function ClientJourney() {
  const id = useId();
  const [active, setActive] = useState(0);
  const step = stages[active];

  return (
    <section id="how-it-works" className={styles.journey} aria-labelledby={`${id}-heading`}>
      <div className={styles.wrap}>
        <div className={styles.intro}>
          <div>
            <p className={styles.kicker}><Layers3 size={14} aria-hidden /> The Vigil process</p>
            <h2 id={`${id}-heading`}>The launch is<br className={styles.wideBreak} /> <em>the beginning.</em></h2>
          </div>
          <p>We build your website, then help you run what happens on it. Follow the path from your first brief to your first inquiry, booking, and update.</p>
        </div>
        <ol className={styles.stops} aria-label="Explore each stage">
          {stages.map(({ name, icon: Icon }, index) => (
            <li key={name}>
              <button type="button" aria-pressed={active === index} aria-controls={`${id}-detail`} onClick={() => setActive(index)}>
                <span className={styles.number}>0{index + 1}</span>
                <Icon size={17} aria-hidden />
                <span>{name}</span>
              </button>
            </li>
          ))}
        </ol>
        <div id={`${id}-detail`} className={styles.detail} aria-live="polite">
          <div key={step.name} className={styles.detailCopy}>
            <p className={styles.kicker}><CircleDot size={13} aria-hidden /> {step.label}</p>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <Link href={step.href}>{step.link} <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <div className={styles.signalFrame} aria-hidden="true">
            <div key={step.name} className={styles.signalPanel}>
              <div className={styles.signalHeader}>
                <span><step.icon size={16} /> {step.name}</span>
                <small>Illustrative preview</small>
              </div>
              {step.signals.map(([label, status], index) => (
                <div className={styles.signalRow} key={label}>
                  <span><i />{label}</span>
                  <span className={index === 2 ? styles.signalAccent : undefined}>{index === 2 && <Check size={12} />}{status}</span>
                </div>
              ))}
            </div>
            <ArrowDownRight className={styles.frameMark} size={38} strokeWidth={1} />
          </div>
        </div>
      </div>
    </section>
  );
}
