"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SectionPayload } from "../../composition/schemas";
import type { ChorusSettings } from "../../composition/evidence-schemas";
import type { Testimonial } from "../../evidence/types";
import { MeasuredLoop } from "../../motion/MeasuredLoop";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { EvidenceShell } from "./shared";
import { EvidencePicture } from "./EvidencePicture";
function ChorusVoice({ voice, settings, visual = false }: { voice: Testimonial; settings: ChorusSettings; visual?: boolean }) {
  const cards = settings.cardSettings;
  const media = settings.authorTreatment === "organization" ? voice.author.logo : settings.authorTreatment === "avatar" ? voice.author.avatar ?? voice.portrait : settings.authorTreatment === "portrait" || settings.visualStyle === "portrait-led" ? voice.portrait ?? voice.author.avatar : undefined;
  const order = cards?.order ?? ["portrait","quote","name","role","company"];
  return <article className="de-chorus-voice" data-author={settings.authorTreatment} data-card-design={cards?.design ?? (settings.surface === "surface" ? "solid" : settings.surface === "framed" ? "outline" : "transparent")} data-card-shape={cards?.shape ?? "square"} data-card-hover={cards?.hover ?? "none"} data-horizontal={cards?.horizontal ?? settings.alignment} data-vertical={cards?.vertical ?? "start"} data-portrait-frame={cards?.portraitFrame ?? (settings.authorTreatment === "avatar" ? "circle" : "square")} data-portrait-align={cards?.portraitAlignment ?? cards?.horizontal ?? settings.alignment}>
    {order.map(piece => {
      if (piece === "portrait") return media && <div key={piece} data-card-piece="portrait"><EvidencePicture image={media} label="Speaker portrait"/></div>;
      if (piece === "quote") return <figure key={piece} className="de-chorus-quotation"><blockquote><p>{voice.quote}</p></blockquote></figure>;
      if (piece === "name") return <strong key={piece} data-card-piece="name">{!visual && voice.author.profileUrl ? <a href={voice.author.profileUrl}>{voice.author.name}</a> : voice.author.name}</strong>;
      if (piece === "role") return voice.author.role && <p key={piece} className="de-mono" data-card-piece="role">{voice.author.role}</p>;
      return voice.author.organization && <p key={piece} className="de-mono" data-card-piece="company">{voice.author.organization}</p>;
    })}
  </article>;
}
export function MovingChorus(props: SectionPayload<"proof.moving-chorus"> & { id: string }) {
  const { id, content, evidenceMode, motion, ...settings } = props;
  const policy = useMotionPolicy(), [focused,setFocused] = useState(false);
  const still = policy.reduced || motion === "none" || focused, cards = settings.cardSettings;
  const host = useRef<HTMLDivElement>(null), geometry = JSON.stringify(settings);
  useEffect(() => {
    const root = host.current;
    if (!root || !cards?.equalHeight) return;
    const voices = [...root.querySelectorAll<HTMLElement>(still ? ".de-chorus-canonical .de-chorus-voice" : '[data-loop-copy="0"] .de-chorus-voice')];
    let frame = 0, disposed = false, width = -1;
    const measure = () => {
      frame = 0;
      if (disposed || !root.offsetWidth) return;
      // Measure natural height first so shortening a quote can shrink the shared height.
      root.style.removeProperty("--de-card-equal-height");
      const height = Math.max(0, ...voices.map(voice => voice.offsetHeight + 1));
      root.style.setProperty("--de-card-equal-height", `${height}px`);
    };
    const queue = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure); };
    // Observe content rather than the height we set, avoiding resize feedback loops.
    const contentResize = new ResizeObserver(queue);
    voices.forEach(voice => [...voice.children].forEach(piece => contentResize.observe(piece)));
    const hostResize = new ResizeObserver(entries => {
      const next = entries[0].contentRect.width;
      if (next !== width) { width = next; queue(); }
    });
    hostResize.observe(root);
    document.fonts.ready.then(queue);
    document.fonts.addEventListener("loadingdone", queue);
    queue();
    return () => { disposed = true; cancelAnimationFrame(frame); contentResize.disconnect(); hostResize.disconnect(); document.fonts.removeEventListener("loadingdone",queue); root.style.removeProperty("--de-card-equal-height"); };
  }, [cards?.equalHeight, geometry, content, still]);
  const style = { "--de-card-width": cards?.width ? `${cards.width}px` : undefined, "--de-card-height": cards?.minHeight !== undefined ? `${cards.minHeight}px` : "0px", "--de-card-padding": cards?.padding !== undefined ? `${cards.padding}px` : "24px", "--de-card-gap": cards?.gap !== undefined ? `${cards.gap}px` : undefined, "--de-card-quote": cards?.quoteSize ? `${cards.quoteSize}px` : undefined, "--de-card-portrait": `${cards?.portraitSize ?? 72}px` } as CSSProperties;
  return <EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E06">
    <div ref={host} className="de-moving-chorus" style={style} data-equal-height={cards?.equalHeight || undefined} data-layout={settings.layout} data-columns={settings.columns} data-style={settings.visualStyle} data-align={settings.alignment} data-scale={settings.quoteScale} data-surface={settings.surface} data-intensity={settings.intensity} data-still={still} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      {!still && <div className="de-chorus-loops">{Array.from({ length: settings.layout === "ribbon" ? 1 : settings.columns === "two" ? 2 : 3 }, (_,column) => {
        const count = settings.layout === "ribbon" ? 1 : settings.columns === "two" ? 2 : 3;
        const voices = content.voices.filter((_,index) => index % count === column);
        return <MeasuredLoop key={column} axis={settings.layout === "ribbon" ? "horizontal" : "vertical"} items={voices.map(voice => <ChorusVoice key={voice.id} voice={voice} settings={settings} visual/>)} direction={column % 2 ? settings.direction === "left" ? "right" : "left" : settings.direction} speed={settings.speed} intensity={settings.intensity} gap={settings.gap} edgeFade={settings.edgeFade} pauseOnHover={settings.pauseOnHover === "yes"} paused={focused} hoverCards/>;
      })}</div>}
      <div className={`de-chorus-canonical ${still ? "de-chorus-wall" : "de-visually-hidden"}`} role="list" aria-label="Testimonials">{content.voices.map(voice => <div key={voice.id} role="listitem" tabIndex={0}><ChorusVoice voice={voice} settings={settings}/></div>)}</div>
    </div>
  </EvidenceShell>;
}
