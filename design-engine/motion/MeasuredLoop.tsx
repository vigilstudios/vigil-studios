"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionPolicy } from "./MotionPolicy";
import { usePageVisible } from "./visibility";
export type LoopSpeed = "slow"|"medium"|"fast";
/** Constant travel rate; semantic speeds remain readable across short and long cycles. */
export function loopGeometry(width:number,viewport:number,speed:LoopSpeed,mobile:boolean,intensity:"subtle"|"standard"|"expressive") {
 const rate = {slow:18,medium:28,fast:40}[speed] * (mobile ? .65 : 1) * {subtle:.85,standard:1,expressive:1.1}[intensity];
 return { copies: Math.max(2,Math.ceil(viewport/Math.max(width,1))+1), duration:width/rate };
}
/** A visual-only loop. Its owner supplies one canonical accessible reading surface.
 * Measurement happens on resize/font changes, never on animation frames. The repeated
 * group includes its trailing gap, so translating exactly one group is periodic.
 */
export function MeasuredLoop({items,direction,speed,intensity,paused,pauseOnHover,edgeFade,gap,axis="horizontal"}:{axis?:"horizontal"|"vertical";items:readonly ReactNode[];direction:"left"|"right";speed:LoopSpeed;intensity:"subtle"|"standard"|"expressive";paused:boolean;pauseOnHover:boolean;edgeFade:"none"|"soft";gap:"compact"|"regular"|"spacious"}) {
 const viewport=useRef<HTMLDivElement>(null), group=useRef<HTMLDivElement>(null);
 const [copies,setCopies]=useState(2), [visible,setVisible]=useState(false);
 const pageVisible=usePageVisible(), policy=useMotionPolicy();
 useEffect(()=>{
  const host=viewport.current, original=group.current;
  if(!host || !original || policy.reduced) return;
  let disposed=false,frame=0;
  const measure=()=>{
   frame=0; if(disposed) return;
   const width=axis === "vertical" ? original.offsetHeight : original.getBoundingClientRect().width, available=axis === "vertical" ? host.clientHeight : host.clientWidth;
   if(!width || !available) return;
   const geometry=loopGeometry(width,available,speed,host.clientWidth<600,intensity);
   host.style.setProperty("--de-loop-distance",`${width}px`);
   host.style.setProperty("--de-loop-duration",`${geometry.duration / Math.max(.65,policy.distance)}s`);
   host.dataset.ready="true";
   setCopies(current=>current===geometry.copies?current:geometry.copies);
  };
  const queue=()=>{ if(!frame) frame=requestAnimationFrame(measure); };
  const resize=new ResizeObserver(queue);resize.observe(host);resize.observe(original);
  const intersection=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:0});intersection.observe(host);
  document.fonts.ready.then(()=>{if(!disposed)queue();});document.fonts.addEventListener("loadingdone",queue);
  queue();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();document.fonts.removeEventListener("loadingdone",queue);};
 },[speed,intensity,policy.reduced,policy.distance,axis]);
 return <div ref={viewport} className="de-measured-loop" aria-hidden="true" data-axis={axis} data-running={visible && pageVisible && !paused && !policy.reduced} data-direction={direction} data-hover-pause={pauseOnHover} data-fade={edgeFade} data-gap={gap}>
 <div className="de-measured-loop-track" inert>
 {Array.from({length:policy.reduced?1:copies},(_,copy)=><div key={copy} ref={copy===0?group:undefined} className="de-measured-loop-group" data-loop-copy={copy}>{items.map((item,i)=><div key={i} className="de-measured-loop-item">{item}</div>)}</div>)}
 </div></div>;
}
