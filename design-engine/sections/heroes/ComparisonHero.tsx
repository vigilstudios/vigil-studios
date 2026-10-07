"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";
import { SectionActions } from "../../actions/SectionActions";

export function ComparisonHero({ id, content: c, media, treatment, structure, contentAlignment = "left" }: SectionInstance<"hero.comparison">) {
  const initial = structure === "inspection" ? 35 : 50;
  const [value, setValue] = useState(initial);
  return <section id={id} className="de-production-hero de-comparison" data-content-alignment={contentAlignment} aria-labelledby={`${id}-title`}>
    <div className="de-comparison__visual"><TreatedImage image={media.after} treatment={treatment} priority />
      <div className="de-comparison__before" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}><TreatedImage image={media.before} treatment={treatment} priority /></div>
      <div className="de-comparison__seam" style={{ left: `${value}%` }} aria-hidden="true" />
    </div>
    <div className="de-comparison__content de-production-copy">
      {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}<h1 id={`${id}-title`} className="de-display">{c.title}</h1><p className="de-text">{c.description}</p>
      <label className="de-accent" htmlFor={`${id}-range`}>{c.beforeLabel} <output>{value}%</output></label>
      <input id={`${id}-range`} type="range" min="0" max="100" step="1" value={value} onChange={event => setValue(Number(event.target.value))} aria-valuetext={`${value}% ${c.beforeLabel}; ${100 - value}% ${c.afterLabel}`} />
      <div className="de-comparison__controls"><button type="button" onClick={() => setValue(Math.max(0, value - 10))} aria-label={`Show more ${c.afterLabel}`}>−</button><button type="button" onClick={() => setValue(initial)}>Reset comparison</button><button type="button" onClick={() => setValue(Math.min(100, value + 10))} aria-label={`Show more ${c.beforeLabel}`}>+</button></div>
      <SectionActions primary={c.action} />
    </div>
  </section>;
}
