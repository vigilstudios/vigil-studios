"use client";
/* eslint-disable @next/next/no-img-element */
import { useId, useState, type CSSProperties } from "react";
import type { MediaBrief, MediaItem } from "./fixtures";

function GalleryTile({ item, index }: { item: MediaItem; index: number }) {
  const panelId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && (hovered || focused || pinned);
  return <article className="m13-tile" data-item={item.id}
    onPointerEnter={event => { if (event.pointerType === "mouse") { setHovered(true); setDismissed(false); } }}
    onPointerLeave={() => setHovered(false)}
    onKeyDown={event => { if (event.key === "Escape") { setPinned(false); setDismissed(true); } }}>
    <button type="button" className="m13-image-button" aria-label={`Details for ${item.title}`} aria-expanded={visible} aria-controls={panelId}
      onFocus={event => { setFocused(event.currentTarget.matches(":focus-visible")); setDismissed(false); }}
      onBlur={() => { setFocused(false); setPinned(false); }}
      onClick={() => { setPinned(!pinned); setDismissed(pinned); }}>
      <img className="m13-image" src={item.src} alt={item.alt} width={item.width} height={item.height} loading={index < 2 ? "eager" : "lazy"} decoding="async" style={{ objectPosition: `${item.focal[0]}% ${item.focal[1]}%` }} />
      <span className="m13-tile-number de-mono" aria-hidden="true">{String(index + 1).padStart(2,"0")} / {item.group}</span>
      <span className="m13-detail-toggle" aria-hidden="true">{visible ? "−" : "+"}</span>
    </button>
    <div id={panelId} className="m13-detail-panel" hidden={!visible}>
      <p className="de-mono">{item.group} / {String(index + 1).padStart(2,"0")}</p>
      <h3 className="de-heading">{item.title}</h3>
      <p className="de-text">{item.note}</p>
    </div>
  </article>;
}

/** One viewport row below the navbar; additional media creates native document rows. */
export function ViewportGallery({ brief, viewportHeight }: { brief: MediaBrief; viewportHeight?: number }) {
  const [filter, setFilter] = useState("All");
  const uid = useId();
  const items = brief.items.filter(item => filter === "All" || item.group === filter);
  return <section className="media-study media-study--M13" data-study="M13" data-brief={brief.id} aria-labelledby={`${uid}-title`}
    style={viewportHeight ? { "--m13-viewport-height": `${viewportHeight}px` } as CSSProperties : undefined}>
    <h2 id={`${uid}-title`} className="m13-sr-only">{brief.brand} — {brief.title}</h2>
    <nav className="m13-navbar" aria-label="Gallery navigation">
      <span className="m13-brand de-accent">{brief.brand}</span>
      <div className="m13-nav-filters" aria-label="Gallery categories">{["All", ...new Set(brief.items.map(item => item.group))].map(group =>
        <button type="button" key={group} aria-pressed={filter === group} onClick={() => setFilter(group)}>{group === "All" ? "All pieces" : group}</button>)}</div>
      <span className="m13-count de-mono" role="status">{String(items.length).padStart(2,"0")} pieces</span>
    </nav>
    <div className="m13-grid">{items.map((item,index) => <GalleryTile key={item.id} item={item} index={index} />)}</div>
  </section>;
}
