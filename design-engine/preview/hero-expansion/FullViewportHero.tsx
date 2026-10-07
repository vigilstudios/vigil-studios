import { TreatedImage } from "../../media/TreatedImage";
import type { SectionImage } from "../../media/types";

export const immersiveHeroIds = ["hero.full-scene", "hero.scene-poster"] as const;
export type ImmersiveHeroId = typeof immersiveHeroIds[number];
export type SceneAlignment = "left" | "center" | "right";
export type ScenePosition = "top" | "middle" | "bottom";
export type SceneVoice = "subtle" | "loud";
export type SceneContent = {
 id:string; eyebrow:string; title:string; description:string;
 reference:string; caption:string; action:{label:string;href:string}; image:SectionImage;
};
/** Interactive Lab proposal: client content and focal-aware media enter through props. */
export function FullViewportHero({kind,content:c,alignment="left",position="middle",voice="subtle",ink="light"}:{kind:ImmersiveHeroId;content:SceneContent;alignment?:SceneAlignment;position?:ScenePosition;voice?:SceneVoice;ink?:"light"|"dark"}) {
 const poster=kind==="hero.scene-poster";
 return <section id={c.id} className={`hx-hero ${poster?"hx-poster":"hx-scene"}`} data-align={alignment} data-position={position} data-voice={voice} data-ink={ink} aria-labelledby={`${c.id}-title`}>
  <div className="hx-image"><TreatedImage image={c.image} treatment={{geometry:"full-bleed",tone:"natural"}} priority /></div>
  <div className="hx-shade" aria-hidden="true"/>
  <div className="hx-scene-meta"><span>{c.reference}</span><span>{poster?"02 / Scene Poster":"01 / Full Scene"}</span></div>
  <div className="hx-title-field"><div className="hx-copy">
   <p className="hx-eyebrow">{c.eyebrow}</p><h1 id={`${c.id}-title`}>{c.title}</h1>
   {!poster&&<><p className="hx-description">{c.description}</p><a className="hx-action" href={c.action.href}>{c.action.label}<span aria-hidden="true">↗</span></a></>}
  </div></div>
  {poster?<div className="hx-poster-context"><p className="hx-caption">{c.caption}</p><p className="hx-description">{c.description}</p><a className="hx-action" href={c.action.href}>{c.action.label}<span aria-hidden="true">↗</span></a></div>:<p className="hx-scene-caption">{c.caption}</p>}
 </section>;
}
