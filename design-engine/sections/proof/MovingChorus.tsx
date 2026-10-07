"use client";
import { useState } from "react";
import type { SectionPayload } from "../../composition/schemas";
import type { ChorusSettings } from "../../composition/evidence-schemas";
import type { Testimonial } from "../../evidence/types";
import { MeasuredLoop } from "../../motion/MeasuredLoop";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { EvidenceShell, Attribution, EvidenceSource } from "./shared";
import { EvidencePicture } from "./EvidencePicture";
function ChorusVoice({voice,settings,source=false,index}:{voice:Testimonial;settings:ChorusSettings;source?:boolean;index:number}) {
 const media=settings.authorTreatment === "avatar" ? voice.author.avatar ?? voice.portrait : settings.authorTreatment === "portrait" ? voice.portrait : settings.authorTreatment === "organization" ? voice.author.logo : undefined;
 return <article className={`de-chorus-voice de-chorus-voice-${index%4}`} data-author={settings.authorTreatment}>
 {settings.visualStyle === "editorial" && <span className="de-proof-eyebrow">Voice / {String(index+1).padStart(2,"0")}</span>}
 {media && <EvidencePicture key={media.src} image={media} label={settings.authorTreatment === "organization" ? "Organization mark" : "Speaker portrait"}/>}
 <figure className="de-chorus-quotation"><blockquote><p>{voice.quote}</p></blockquote><figcaption>
 {settings.authorTreatment === "compact" ? <p className="de-chorus-compact-author"><strong>{voice.author.name}</strong>{voice.author.organization && <> · {voice.author.organization}</>}</p> : <Attribution value={voice.author}/>}
 </figcaption></figure>{source && <EvidenceSource value={voice.provenance}/>}</article>;
}
export function MovingChorus(props:SectionPayload<"proof.moving-chorus"> & {id:string}) {
 const {id,content,evidenceMode,motion,...settings}=props;
 const policy=useMotionPolicy(), [paused,setPaused]=useState(false), [reading,setReading]=useState(false), [focused,setFocused]=useState(false);
 const still=policy.reduced || motion === "none";
 return <EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E06">
 <div className="de-moving-chorus" data-layout={settings.layout} data-columns={settings.columns} data-style={settings.visualStyle} data-align={settings.alignment} data-scale={settings.quoteScale} data-surface={settings.surface} data-intensity={settings.intensity} data-still={still} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
 {!still && <div className="de-proof-playback"><button type="button" aria-pressed={paused} aria-controls={`${id}-loop`} onClick={()=>setPaused(v=>!v)}>{paused ? "Resume moving voices" : "Pause moving voices"}</button><p>Pause to read at your own pace. {settings.pauseOnHover === "yes" ? "Hover or focus pauses movement." : "Keyboard focus pauses movement."} All voices and sources are available below.</p></div>}
 {!still && <div id={`${id}-loop`} className="de-chorus-loops">{Array.from({length:settings.layout === "ribbon" ? 1 : settings.columns === "two" ? 2 : 3},(_,column)=> {
 const count=settings.layout === "ribbon" ? 1 : settings.columns === "two" ? 2 : 3;
 const voices=content.voices.filter((_,i)=>i%count===column);
 return <MeasuredLoop key={column} axis={settings.layout === "ribbon" ? "horizontal" : "vertical"} items={voices.map((voice,index)=><ChorusVoice key={voice.id} voice={voice} settings={settings} index={index}/>)} direction={column%2 ? settings.direction === "left" ? "right" : "left" : settings.direction} speed={settings.speed} intensity={settings.intensity} gap={settings.gap} edgeFade={settings.edgeFade} pauseOnHover={settings.pauseOnHover === "yes"} paused={paused || reading || focused}/>;
 })}</div>}
 {/* Only direct summary activation changes visitor intent. Native toggle events also
     fire for automatic still-mode changes (and bubble from nested source disclosures). */}
 <details className="de-chorus-reading" open={still || reading}>
 <summary onClick={e=>{
   if(still) return;
   e.preventDefault();
   setReading(value=>!value);
 }}>{still ? "All voices and sources · still reading view" : `Read all ${content.voices.length} voices and sources`}</summary>
 <div className="de-chorus-wall">{content.voices.map((voice,index)=><ChorusVoice key={voice.id} voice={voice} settings={settings} source index={index}/>)}</div>
 </details></div></EvidenceShell>;
}
