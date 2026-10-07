"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { MeasuredLoop } from "../../motion/MeasuredLoop";
import { ItemAction } from "../../actions/SectionActions";
import { Plate } from "../work/shared";
import { ImportHeading } from "./shared";
export function ImageMarqueeHero({id,content,structure,motion,direction,speed,tilt,ratio,surface}:SectionInstance<"hero.image-marquee">) {
 const policy=useMotionPolicy(),[paused,setPaused]=useState(false),[reading,setReading]=useState(false),[focused,setFocused]=useState(false);
 const still=policy.reduced || motion === "none";
 return <section id={id} className="de-import de-image-marquee" aria-labelledby={`${id}-title`} data-align={structure} data-surface={surface} data-ratio={ratio} data-tilt={tilt} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
 <ImportHeading id={id} content={content} hero/>
 {!still && <><div className="de-import-controls"><button type="button" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?"Resume image ribbon":"Pause image ribbon"}</button></div><MeasuredLoop items={content.images.map((record,i)=><figure key={record.id} className="de-marquee-image" data-odd={i%2===1}><Plate image={record.thumbnail??record.image}/></figure>)} direction={direction} speed={speed} intensity="standard" gap="regular" edgeFade="soft" pauseOnHover paused={paused || reading || focused}/></>}
 <details open={still || reading} className="de-import-reading"><summary onClick={e=>{if(!still){e.preventDefault();setReading(v=>!v);}}}>{still?"Image collection":`Explore all ${content.images.length} images`}</summary><div className="de-import-contact-sheet">{content.images.map(record=><figure key={record.id}><Plate image={record.thumbnail??record.image}/><figcaption><h3 className="de-heading">{record.title}</h3>{record.note&&<p className="de-text">{record.note}</p>}<ItemAction group="images" itemId={record.id}/></figcaption></figure>)}</div></details>
 </section>;
}
