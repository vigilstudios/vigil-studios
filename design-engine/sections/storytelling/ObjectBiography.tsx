import { SectionActions } from "../../actions/SectionActions";
import type { SectionInstance } from "../../composition/schemas";
import { TreatedImage } from "../../media/TreatedImage";

/** Artifact, observations and continuity form one dossier. No fixture imports. */
export function ObjectBiography({ id, content: c, media, treatment, structure }: SectionInstance<"story.object-biography">) {
  return <section id={id} className={`de-story de-object-biography de-object-biography--${structure}`} aria-labelledby={`${id}-title`}>
    <header className="de-story-intro"><h2 id={`${id}-title`} className="de-heading">{c.title}</h2><p className="de-text">{c.introduction}</p></header>
    <div className="de-object-biography__dossier"><div className="de-object-biography__artifact"><p className="de-accent">{c.subject}</p><TreatedImage image={media.image} treatment={treatment} /></div>
      <ol className="de-object-biography__records">{c.records.map((record, index) => <li key={index}><span className="de-mono">0{index + 1} / {record.label}</span><h3 className="de-heading de-heading--subsection">{record.title}</h3><p className="de-text">{record.body}</p></li>)}</ol>
    </div><div className="de-object-biography__continuation"><p className="de-accent">{c.origin}</p><p className="de-heading">{c.continuation}</p></div>
  <SectionActions/></section>;
}
