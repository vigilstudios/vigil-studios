import { TreatedImage } from "../../media/TreatedImage";
import type { StoryStudy, StoryAdaptation } from "./fixtures";

/** Preserved creative sketches; not registered production implementations. */
export function StoryStudyArtwork({ study: s, adaptation: a }: { study: StoryStudy; adaptation: StoryAdaptation }) {
  const image = (kind: "object" | "second", geometry: "portrait-emphasis" | "panorama" | "editorial-crop" | "contained" = "portrait-emphasis") => <TreatedImage image={a[kind]} treatment={{ geometry, tone: "natural" }} />;
  return <section className={`story-study story-study--${s.id}`} aria-label={`${s.id} ${s.name}`}>
    <header className="story-study-folio"><span className="de-accent">{a.client} / About the practice</span><span className="de-mono">{s.id} · {s.name}</span></header>
    {s.id === "S01" ? <>
      <header className="s01-heading"><span className="de-mono">One object. A way of seeing.</span><h2 className="de-display">{a.title}</h2></header>
      <div className="s01-dossier"><div className="s01-artifact"><span className="de-mono">01 / {a.subject}</span>{image("object")}</div><ol>{a.records.map((r, i) => <li key={r.label}><span className="de-mono">0{i + 1} / {r.label}</span><h3 className="de-heading">{r.title}</h3><p className="de-text">{r.body}</p></li>)}</ol><p className="s01-side de-mono">A record of attention</p></div>
      <div className="s01-close"><span className="de-accent">{a.origin}</span><p className="de-heading">{a.continuation}</p></div>
    </> : null}
    {s.id === "S02" ? <>
      <div className="s02-preface"><h2 className="de-accent">What we believe</h2><p className="de-text">{a.deck}</p></div>
      <ol className="s02-folds">{a.fragments.map((f, i) => <li key={f}><span className="de-mono">0{i + 1}</span><h3 className="de-display">{f}</h3><p className="de-text">{a.records[i].body}</p></li>)}</ol>
    </> : null}
    {s.id === "S03" ? <>
      <div className="s03-intro"><h2 className="de-heading">Between a question<br />and a way of working.</h2><p className="de-mono">Two illustrative voices / A working conversation</p></div>
      {a.exchanges.map((e, i) => <article className="s03-turn" key={e.question}><h3 className="de-display"><span className="de-mono">0{i + 1} /</span>{e.question}</h3><div className="s03-response"><div><p className="de-accent">{e.speaker}</p><p className="de-mono">{e.role}</p></div><p className="de-text">{e.answer}</p></div></article>)}<p className="s03-attribution de-mono">Invented dialogue for an imagined brief. Replace with approved voices.</p>
    </> : null}
    {s.id === "S04" ? <>
      <h2 className="de-heading">A practice is a return,<br />not a straight line.</h2>
      <div className="s04-field"><div className="s04-orbit" aria-hidden="true"><svg viewBox="0 0 500 500"><circle cx="250" cy="250" r="175" /><path d="M385.394 154.51 L401.554 162.5 L402.714 144.51" /></svg><p className="de-heading">{a.continuation}</p>{["Observe", "Interpret", "Try", "Return"].map((word, i) => <span className={`s04-station s04-station--${i}`} key={word}><small className="de-mono">0{i + 1}</small><strong className="de-accent">{word}</strong></span>)}</div><ol className="s04-key">{[...a.records, { label: "Return", title: "Ask again", body: a.continuation }].map((r, i) => <li key={i}><h3 className="de-accent">0{i + 1} / {["Observe", "Interpret", "Try", "Return"][i]}</h3><p className="de-text">{r.body}</p></li>)}</ol></div>
    </> : null}
    {s.id === "S05" ? <>
      <h2 className="de-display">What we receive.<br /><em>What we carry.</em></h2>
      <figure className="s05-first"><figcaption><span className="de-accent">Received / {a.origin}</span><p className="de-text">{a.records[0].body}</p></figcaption>{image("object", "panorama")}</figure>
      <p className="s05-hinge de-heading">{a.deck}</p>
      <figure className="s05-second"><figcaption><span className="de-accent">Carried / {a.continuation}</span><p className="de-text">{a.records[2].body}</p></figcaption>{image("second", "panorama")}</figure>
    </> : null}
    {s.id === "S06" ? <>
      <div className="s06-intro"><h2 className="de-heading">Belief has a<br />working consequence.</h2><p className="de-mono">A decision ledger / No claim without a choice</p></div>
      <div className="s06-columns de-mono" aria-hidden="true"><span>Principle</span><span>The tension</span><span>In practice</span></div><ol className="s06-ledger">{a.decisions.map((d, i) => <li key={d.belief}><div className="s06-row"><h3 className="de-heading"><small className="de-mono">0{i + 1} / </small>{d.belief}</h3><p className="de-accent">{d.tension}</p><p className="de-text">{d.practice}</p></div><p className="s06-rationale de-mono">↳ {d.rationale}</p></li>)}</ol>
    </> : null}
    {s.id === "S07" ? <>
      <h2 className="de-display s07-salutation">To the next<br /><em>pair of hands,</em></h2><div className="s07-letter"><p className="de-text">{a.records[0].body} {a.records[1].body}</p><p className="de-text s07-indent">{a.records[2].body} {a.deck}</p><p className="s07-signoff de-accent">With care,<br />{a.client}</p></div><aside className="s07-postscript"><span className="de-mono">P.S.</span><p className="de-heading">{a.continuation}</p></aside>
    </> : null}
    {s.id === "S08" ? <>
      <div className="s08-heading"><h2 className="de-heading">Nothing ends<br />at our hands.</h2><p className="de-mono">A relay of responsibility / Three readings</p></div>
      <ol className="s08-relay">{[a.object, { ...a.object, focal: { x: 50, y: 70 } }, a.object].map((source, i) => <li key={i}><div><TreatedImage image={source} treatment={{ geometry: "portrait-emphasis", tone: i === 1 ? "monochrome" : "natural" }} /><h3 className="de-display">{["Find", "Work", "Pass"][i]}<span aria-hidden="true">↗</span></h3></div><p className="de-accent">0{i + 1} / {a.records[i].title}</p><p className="de-text">{a.records[i].body}</p></li>)}</ol>
    </> : null}
    <footer className="story-study-source de-mono">{a.context} · Illustrative copy & generated study assets · Motion none</footer>
  </section>;
}
