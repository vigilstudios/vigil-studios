import type { SectionInstance } from "../../composition/schemas";
import { SectionActions } from "../../actions/SectionActions";

export function OpenCircuitHero({ id, content: c, media: { signal }, structure }: SectionInstance<"hero.open-circuit">) {
  const values = signal.samples.map(sample => sample.value);
  const min = Math.min(...values), max = Math.max(...values);
  const scale = Math.max(1, ...values.map(Math.abs)), floor = min / scale, range = max / scale - floor;
  const points = signal.samples.map((sample, index) => `${index / (values.length - 1) * 960 + 20},${200 - (sample.value / scale - floor) / (range || 1) * 160}`).join(" ");
  return <section id={id} className={`de-production-hero de-open-circuit de-open-circuit--${structure}`} aria-labelledby={`${id}-title`}>
    <div className="de-open-circuit__proposition"><div className="de-production-copy">
      {c.eyebrow ? <p className="de-accent">{c.eyebrow}</p> : null}<h1 id={`${id}-title`} className="de-display">{c.title}</h1>
    </div><p className="de-text">{c.description}</p></div>
    <figure className="de-open-circuit__signal">
      <svg viewBox="0 0 1000 240" role="img" aria-labelledby={`${id}-plot-title ${id}-plot-description`}>
        <title id={`${id}-plot-title`}>{signal.label}</title><desc id={`${id}-plot-description`}>{signal.illustrative ? "Illustrative data. " : ""}{signal.source}. Range {min} to {max} {signal.unit}.</desc>
        <path d="M20 220H980" fill="none" stroke="currentColor" opacity=".4" />
        <polyline points={points} fill="none" stroke="var(--de-accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="de-mono">{signal.illustrative ? "Illustrative data · " : ""}{signal.source} · {signal.unit}</figcaption>
    </figure>
    <div className="de-open-circuit__baseline"><strong className="de-display">{c.readout}</strong><p className="de-mono">{signal.samples[0].label} — {signal.samples.at(-1)!.label}</p><SectionActions primary={c.action} /></div>
    <details className="de-signal-values"><summary>Read signal values</summary><table><caption>{signal.label}</caption><thead><tr><th scope="col">Sample</th><th scope="col">Value ({signal.unit})</th></tr></thead><tbody>{signal.samples.map((sample, index) => <tr key={index}><th scope="row">{sample.label}</th><td>{sample.value}</td></tr>)}</tbody></table></details>
  </section>;
}
