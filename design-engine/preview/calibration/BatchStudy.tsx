import type { HeroConcept } from "./batch";
import { StudyImage } from "./RetestStudy";
/** Static art-direction sketches. Actions are visibly labeled study copy, never fake working controls. */
export function BatchStudy({ concept: c }: { concept: HeroConcept }) {
  const small = (text: string) => <p className="de-accent">{text}</p>;
  const title = (text: string) => <h1 className="de-display">{text}</h1>;
  const action = (text: string) => <span className="study-action">{text} ↗</span>;
  return <section className={`batch-study batch-study--${c.id}`} aria-label={`${c.id} ${c.name} concept`}>
    {c.id === "H17" ? <>
      <header className="b17-mast"><span className="de-mono">VOL. 01 / FIELD JOURNAL</span><span className="de-accent">Places & people</span></header>
      <div className="b17-name de-display">The Good Earth</div><div className="b17-story"><div>{small("The coast issue")}{title("Where the land meets possibility.")}{action("Read the field story")}</div><StudyImage name="coast" alt="Coastal architecture framing the sea" /><aside className="de-text">A journal of places shaped by patience.<br/><br/>Stone. Light. A horizon that never stands still.</aside></div>
    </> : null}
    {c.id === "H18" ? <>
      <header className="study-mast"><span className="de-mono">CIRCUIT / SYSTEMS</span><span className="de-mono">SIGNAL STUDY — NOT LIVE DATA</span></header><div className="b18-top">{title("Continuity you can see.")}<p className="de-text">Make every connection count.<br/>Infrastructure with a measurable purpose.</p></div>
      <svg className="b18-signal" viewBox="0 0 1000 240" role="img" aria-label="Illustrative continuous signal with a brief dip and recovery"><path d="M0 180H150L170 80L190 205L220 40L240 180H390L420 130L445 180H640L660 75L680 200L705 40L730 180H1000" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="730" cy="180" r="7" fill="currentColor"/></svg>
      <footer className="b18-readout"><strong className="de-display">24:00</strong><span className="de-mono">ILLUSTRATIVE WINDOW<br/>One connected system.</span>{action("Explore the system")}</footer>
    </> : null}
    {c.id === "H19" ? <>
      <header className="study-mast">{small("PUBLIC / ASSEMBLY")}{small("Season opening")}</header><div className="b19-bill">{title("MAKE\nSOME\nNOISE.")}<aside><strong className="de-display">17<br/>10</strong><span className="de-mono">FRIDAY<br/>DOORS 19:00</span></aside></div><footer className="b19-program"><span>Live sound / New work / One room</span>{action("Find your ticket")}</footer>
    </> : null}
    {c.id === "H20" ? <>
      <header className="study-mast"><span className="de-accent">COMMON / HOUSE</span><span className="de-accent">Everyone has a place.</span></header>{title("What brings you here?")}<p className="de-text b20-intro">A little room to think. A good reason to stay.</p><StudyImage name="portrait" alt="A person in linen standing in soft daylight"/><footer className="b20-routes">I’m here to <span>find my place ↗</span> or <span>bring people together ↗</span></footer>
    </> : null}
    {c.id === "H21" ? <>
      <header className="study-mast">{small("CIVIC / OFFICE")}{small("Work in progress")}</header>{title("Places for public life.")}<div className="b21-row"><span className="de-mono">01</span><strong>At the water’s edge</strong><span>2026 ↗</span></div><StudyImage name="coast" alt="Panoramic limestone residence at the coast"/><div className="b21-row"><span className="de-mono">02</span><strong>A new common ground</strong><span>2027 +</span></div>
    </> : null}
    {c.id === "H22" ? <>
      <header className="study-mast">{small("ENTRACTE")}{small("A season in motion")}</header>{title("Before the gesture.")}<div className="b22-ribbon"><span className="de-mono">ACT I<br/>THE PAUSE</span><StudyImage name="performer" alt="Performer suspended in a theatrical gesture"/></div><div className="b22-bottom"><p className="de-text">A moment held.<br/>A world about to move.</p><span className="de-display">After the silence.</span></div>{action("Meet the season")}
    </> : null}
    {c.id === "H23" ? <>
      <header className="study-mast">{small("MAISON / FORME")}{small("Objects of permanence")}</header><div className="b23-lockup"><span className="de-display b23-edition" aria-hidden="true">I</span><StudyImage name="chairPortrait" alt="Edition One brushed metal chair"/><div>{small("Edition One")}{title("An object.\nA lifetime.")}<p className="de-text">Brushed metal.<br/>Made slowly, kept forever.</p>{action("View the edition")}</div></div><footer className="de-mono">Material study / Edition 01 / A continuing collection</footer>
    </> : null}
    {c.id === "H24" ? <>
      <header className="study-mast">{small("STANDARD / WORKS")}{small("Built around you")}</header><div className="b24-main">{title("FIT.\nFORM.\nFUNCTION.")}<div className="b24-diagram" role="img" aria-label="Exploded diagram of three shelving planes"><div/><div/><div/><span className="de-mono">A / TOP<br/>B / CORE<br/>C / BASE</span></div></div><footer className="b24-spec"><span className="de-mono">THREE PARTS.<br/>YOUR CONFIGURATION.</span>{action("Make it yours")}</footer>
    </> : null}
    {c.id === "H25" ? <>
      <header className="study-mast">{small("THE / CAMPUS")}{small("One place. Many possibilities.")}</header>{title("Follow your curiosity.")}<div className="b25-routes"><span className="de-accent b25-origin">You are here</span><ol><li><span className="de-mono">01 / THE GALLERY</span><strong>See something new</strong><span>↗</span></li><li><span className="de-mono">02 / THE WORKSHOP</span><strong>Try it for yourself</strong><span>↗</span></li><li><span className="de-mono">03 / THE COURTYARD</span><strong>Find your people</strong><span>↗</span></li></ol></div>
    </> : null}
    {c.id === "H26" ? <>
      <header className="study-mast">{small("good company")}{small("a collective for the everyday")}</header><p className="de-text b26-pre">There is another way to make things.</p>{title("less new.\nmore you.")}<div className="b26-choice"><span className="de-accent">Today, let’s</span><strong className="de-display">mend.</strong><span className="de-accent">reuse. / reinvent.</span></div><footer>{action("Bring something worth keeping")}</footer>
    </> : null}
    {c.id === "H27" ? <>
      <header className="study-mast">{small("RE / SOURCE")}{small("A practice of care")}</header><div className="b27-argument"><div>{small("Our point of view")}{title("The future is already here.\nIt needs looking after.")}<p className="de-text">We work with what exists, uncovering the value in the places and materials around us.</p>{action("See the practice")}</div><aside><span className="de-mono">FIELD NOTE / 001</span><StudyImage name="detail" alt="Texture and construction detail of a limestone facade"/><p className="de-text">Look closer.<br/>Keep what matters.</p><span className="de-mono">Illustrative material study<br/>Project evidence goes here.</span></aside></div>
    </> : null}
    {c.id === "H28" ? <>
      <header className="study-mast">{small("NIGHT / SCHOOL")}{small("An evening series")}</header><div className="b28-scene"><aside className="de-mono">SEASON 01<br/>FRIDAYS<br/>AFTER DARK</aside><StudyImage name="performer" alt="Stage performer in a narrow beam of warm light"/></div><div className="b28-floor">{title("AFTER HOURS")}<span className="de-accent">Stay a little longer.<br/>{action("See what’s on")}</span></div>
    </> : null}
  </section>;
}
