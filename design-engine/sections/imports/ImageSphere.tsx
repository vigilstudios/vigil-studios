"use client";
import { useEffect,useRef,useState, type PointerEvent } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { usePageVisible } from "../../motion/visibility";
import { ItemAction } from "../../actions/SectionActions";
import { Plate } from "../work/shared";
import { ImportHeading } from "./shared";
import { spherePoint } from "./sphere-geometry";
export function ImageSphere({id,content,structure,motion,speed,direction,shape,surface}:SectionInstance<"work.image-sphere">) {
 const sphere=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),restore=useRef<HTMLElement|null>(null);
 const rotation=useRef({x:.1,y:0}),drag=useRef<{id:number;x:number;y:number;distance:number}|null>(null),velocity=useRef({x:0,y:0});
 const [paused,setPaused]=useState(false),[focused,setFocused]=useState(false),[hovered,setHovered]=useState(false),[selected,setSelected]=useState<string|null>(null);
 const policy=useMotionPolicy(),pageVisible=usePageVisible();
 const draw=useRef<()=>void>(()=>{});
 const auto=!policy.reduced && motion !== "none" && !paused && !focused && !hovered && !selected && pageVisible;
 useEffect(()=>{
  const host=sphere.current;if(!host)return;
  let frame=0,last=0,visible=false,disposed=false;
  const paint=()=>{
   const radius=host.clientWidth*.36;
   host.style.setProperty("--de-sphere-size",`${Math.max(40,Math.min(120,host.clientWidth/Math.sqrt(content.images.length)*.65))}px`);
   Array.from(host.querySelectorAll<HTMLElement>("[data-sphere-node]")).forEach((node,index)=>{
    const p=spherePoint(index,content.images.length,rotation.current.x,rotation.current.y);
    const scale=.6+(p.z+1)*.25;
    node.style.transform=`translate3d(${p.x*radius}px,${p.y*radius}px,0) scale(${scale})`;
    node.style.opacity=String(Math.max(0,Math.min(1,(p.z+.2)*4)));
    node.style.zIndex=String(Math.round(100+p.z*50));
    node.style.pointerEvents=p.z>-.15?"auto":"none";
   });
  };draw.current=paint;
  const tick=(now:number)=>{
   frame=0;if(disposed)return;
   const delta=Math.min(32,now-last || 16)/1000;last=now;
   if(visible && !drag.current){
    rotation.current.y+=(direction === "left" ? -1 : 1)*{slow:.08,medium:.15,fast:.25}[speed]*delta*policy.distance;
    rotation.current.x=Math.max(-1.2,Math.min(1.2,rotation.current.x+velocity.current.x*delta));rotation.current.y+=velocity.current.y*delta;
    const decay=Math.pow(.06,delta);velocity.current.x*=decay;velocity.current.y*=decay;paint();
   }
   if(auto && visible)frame=requestAnimationFrame(tick);
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(auto && visible && !frame){last=0;frame=requestAnimationFrame(tick);}else if(!visible){cancelAnimationFrame(frame);frame=0;}},{threshold:0});observer.observe(host);
  const resize=new ResizeObserver(paint);resize.observe(host);paint();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();draw.current=()=>{};};
 },[auto,content.images.length,direction,speed,policy.distance]);
 useEffect(()=>{
  const node=dialog.current;if(!node || !selected)return;
  restore.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  node.showModal();
  return ()=>{node.close();restore.current?.focus();};
 },[selected]);
 function end(e:PointerEvent<HTMLDivElement>) {
  if(drag.current?.id!==e.pointerId)return;
  if(drag.current.distance>5){e.preventDefault();drag.current=null;return;}
  const target=document.elementFromPoint(e.clientX,e.clientY) as HTMLElement|null;
  const node=target?.closest<HTMLElement>("[data-sphere-node]");
  if(node?.dataset.record)setSelected(node.dataset.record);
  drag.current=null;
 }
 function turn(x:number,y:number){rotation.current.x=Math.max(-1.2,Math.min(1.2,rotation.current.x+x));rotation.current.y+=y;velocity.current={x:0,y:0};draw.current();}
 const record=content.images.find(r=>r.id===selected);
 return <section id={id} className="de-import de-image-sphere" data-structure={structure} data-shape={shape} data-surface={surface} aria-labelledby={`${id}-title`} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
 <ImportHeading id={id} content={content}/><div className="de-sphere-field">
 <div ref={sphere} className="de-sphere" aria-hidden="true" onPointerEnter={e=>{if(e.pointerType === "mouse")setHovered(true);}} onPointerLeave={()=>setHovered(false)} onPointerDown={e=>{if(e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,distance:0};velocity.current={x:0,y:0};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d || d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;d.distance+=Math.abs(dx)+Math.abs(dy);d.x=e.clientX;d.y=e.clientY;rotation.current.x=Math.max(-1.2,Math.min(1.2,rotation.current.x-dy*.006));rotation.current.y+=dx*.006;velocity.current={x:-dy*.2,y:dx*.2};draw.current();}} onPointerUp={end} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
 {content.images.map(record=><div data-sphere-node data-record={record.id} key={record.id}><Plate image={record.thumbnail??record.image} thumbnail/></div>)}</div>
 <div className="de-import-controls" role="group" aria-label="Rotate image sphere" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();turn(e.key === "ArrowUp" ? -.2 : e.key === "ArrowDown" ? .2 : 0,e.key === "ArrowLeft" ? -.3 : e.key === "ArrowRight" ? .3 : 0);}}}>
 <button type="button" aria-label="Rotate left" onClick={()=>turn(0,-.3)}>←</button><button type="button" aria-label="Rotate up" onClick={()=>turn(-.2,0)}>↑</button><button type="button" aria-label="Rotate down" onClick={()=>turn(.2,0)}>↓</button><button type="button" aria-label="Rotate right" onClick={()=>turn(0,.3)}>→</button>{!policy.reduced && motion !== "none" && <button type="button" aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?"Resume rotation":"Pause rotation"}</button>}
 </div></div>
 <div className="de-sphere-index"><p className="de-mono">All {content.images.length} images · select to inspect</p><ol>{content.images.map(r=><li key={r.id}><button type="button" onClick={()=>setSelected(r.id)}>{r.title}</button><ItemAction itemId={r.id} group="images"/></li>)}</ol></div>
 <dialog ref={dialog} className="de-sphere-dialog" aria-labelledby={`${id}-spotlight-title`} onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left || e.clientX>box.right || e.clientY<box.top || e.clientY>box.bottom)setSelected(null);}}}>
 {record&&<><button type="button" autoFocus onClick={()=>setSelected(null)}>Close image</button><Plate image={record.image} loading="eager"/><h3 className="de-heading" id={`${id}-spotlight-title`}>{record.title}</h3>{record.note&&<p className="de-text">{record.note}</p>}{record.image.caption&&<p className="de-mono">{record.image.caption}</p>}<ItemAction itemId={record.id} group="images"/></>}
 </dialog></section>;
}
