"use client";

import { useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowUpRight, CalendarDays, Circle, ClipboardList, Globe, Inbox, LineChart, PencilLine } from "lucide-react";
import styles from "./field-guide.module.css";

const views = [
  {
    title: "Overview",
    rows: [
      { href: "#outcomes", icon: Globe, item: "Website live", feature: "Hosting & domain", status: "Connected" },
      { href: "#overview", icon: LineChart, item: "Traffic and inquiry report", feature: "Website performance", status: "Last 30 days" },
    ],
  },
  {
    title: "Customer activity",
    rows: [
      { href: "#lead-hub", icon: Inbox, item: "Private dining inquiry", feature: "Lead Hub", status: "New" },
      { href: "#bookings", icon: CalendarDays, item: "Table for two · 7:30 pm", feature: "Bookings", status: "Confirmed" },
    ],
  },
  {
    title: "Website updates",
    rows: [
      { href: "#content-hub", icon: PencilLine, item: "Dinner menu update", feature: "Content Hub", status: "Draft" },
      { href: "#content-hub", icon: ClipboardList, item: "Update holiday hours", feature: "Change requests", status: "In progress" },
    ],
  },
];

function tilt(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") return;
  const panel = event.currentTarget;
  const rect = panel.getBoundingClientRect();
  panel.style.setProperty("--tilt-x", `${(0.5 - (event.clientY - rect.top) / rect.height) * 11}deg`);
  panel.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 12}deg`);
}

function resetTilt(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty("--tilt-x");
  event.currentTarget.style.removeProperty("--tilt-y");
}

export function VigilWorkspacePreview() {
  const [active, setActive] = useState(0);

  return (
    <figure aria-label="Sample Vigil workspace">
      <div className={styles.stackScene} onPointerMove={tilt} onPointerLeave={resetTilt}>
        <div className={styles.stack}>
          {views.map(({ title, rows }, index) => {
            const front = active === index;
            const depth = (index - active + views.length) % views.length;
            return (
              <div key={title} className={`${styles.window} ${styles.stackLayer}`} data-front={front} style={{ "--depth": depth } as CSSProperties}>
                <button type="button" className={`${styles.windowBar} ${styles.stackButton}`} aria-pressed={front} onClick={() => setActive(index)}>
                  <span><small className={styles.label}>0{index + 1}</small> {title}</span>
                  {front ? <Circle size={8} fill="currentColor" aria-hidden /> : <ArrowUpRight size={14} aria-hidden />}
                </button>
                <div className={styles.sample} inert={!front}>
                  <div className={styles.sampleHeading}>
                    <strong>Marlow &amp; Fen</strong>
                    <span className={styles.label}>Example data</span>
                  </div>
                  <ul>
                    {rows.map(({ href, icon: Icon, item, feature, status }) => (
                      <li key={item}>
                        <a href={href} className={styles.sampleRow}>
                          <Icon size={17} aria-hidden />
                          <span><strong>{item}</strong><small>{feature}</small></span>
                          <span className={styles.label}>{status}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className={`${styles.label} ${styles.stackCaption}`}>Select a panel to explore the workspace</figcaption>
    </figure>
  );
}
