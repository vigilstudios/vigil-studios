"use client";
/* eslint-disable @next/next/no-img-element -- Study logos use portable native image fallbacks. */
import { useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from "react";
import { FullViewportHero, type SceneAlignment } from "../hero-expansion/FullViewportHero";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { VigilIcon } from "../../icons/VigilIcon";
import { renderSection } from "../../composition/render";
import { configurationIssues, type HeroContext, type NavigationConfig, type NavigationStudy } from "./contracts";
import { destinationsFor, heroFixture, navigationContexts, type BrandTreatment, type Destination } from "./fixtures";

export function NavigationStudyPreview({ study, adaptation=0, config, hero, logo, long=false, missingLogo=false, heroAlignment="left" }: { study:NavigationStudy;adaptation?:number;config:NavigationConfig;hero:HeroContext;logo?:BrandTreatment;long?:boolean;missingLogo?:boolean;heroAlignment?:SceneAlignment }) {
 const context=navigationContexts[adaptation], [bg,fg,accent]=context.palette;
 const issues=configurationIssues(study,config,hero);
 return <DesignThemeProvider typography={study.typography[adaptation]} artDirection={study.art[adaptation]} motion="restrained" overrides={{color:{background:bg,surface:bg,surfaceElevated:bg,foreground:fg,muted:fg,accent,accentForeground:bg,border:fg}}}>
  {issues.length ? <div role="alert" className="n3-blocked">{issues.join(" ")}</div> : <NavigationArtwork key={`${study.id}-${adaptation}-${hero}-${logo}-${missingLogo}`} {...{study,config,hero,adaptation,long,missingLogo,heroAlignment}} logo={logo ?? context.logo as BrandTreatment}/>}
 </DesignThemeProvider>;
}
function NavigationArtwork({study:s,config:c,hero,adaptation,logo,long,missingLogo,heroAlignment}:{study:NavigationStudy;config:NavigationConfig;hero:HeroContext;adaptation:number;logo:BrandTreatment;long:boolean;missingLogo:boolean;heroAlignment:SceneAlignment}) {
 const context=navigationContexts[adaptation], links=destinationsFor(s,context,long), uid="n3-"+useId().replace(/[^a-z0-9]/gi,"").toLowerCase(), menuId=`${uid}-menu`, heroId=`${uid}-hero`;
 const stage=useRef<HTMLDivElement>(null), heroElement=useRef<HTMLDivElement>(null), nav=useRef<HTMLElement>(null), trigger=useRef<HTMLButtonElement>(null), dialog=useRef<HTMLDialogElement>(null), groupHeading=useRef<HTMLHeadingElement>(null);
 const [open,setOpen]=useState(false),[group,setGroup]=useState<number|null>(null),[scrolled,setScrolled]=useState(false),[pastHero,setPastHero]=useState(false),[hidden,setHidden]=useState(false),[notice,setNotice]=useState(""),[broken,setBroken]=useState(false);
 const {reduced}=useMotionPolicy();
 const modal=["NX02","NX03","NX05","NX08","NX09"].includes(s.id);
 const close=()=>{setOpen(false);if(modal)dialog.current?.close();trigger.current?.focus();};
 const toggle=()=>{if(open) close(); else {setGroup(null);setOpen(true);if(modal)dialog.current?.showModal();}};
 // The slot reserves only the closed header in flow; overlay/floating always have zero footprint.
 useLayoutEffect(()=>{
  const root=stage.current,header=nav.current;if(!root||!header)return;
  const measure=()=>{root.style.setProperty("--n3-header-height",`${Math.ceil(header.getBoundingClientRect().height / (root.getBoundingClientRect().width/root.offsetWidth || 1))}px`);root.style.setProperty("--n3-stage-height",`${root.clientHeight}px`);};
  const observer=new ResizeObserver(measure);observer.observe(header);observer.observe(root);measure();
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const root=stage.current,scene=heroElement.current;if(!root||!scene)return;
  let previous=root.scrollTop;
  const onScroll=()=>{
   const y=root.scrollTop,delta=y-previous,box=root.getBoundingClientRect();
   setScrolled(y>72);
   setPastHero(scene.getBoundingClientRect().bottom <= box.top+1);
   const expanded=Array.from(nav.current?.querySelectorAll(".n3-primary details[open],.n3-wing details[open]")??[]).some(el=>el.checkVisibility());
   setHidden(wasHidden=>c.scroll!=="reveal"||reduced||open||expanded||y<140||nav.current?.contains(document.activeElement)?false:delta>3?true:delta < -3?false:wasHidden);
   previous=y;
  };
  root.addEventListener("scroll",onScroll,{passive:true});
  const observer=new ResizeObserver(onScroll);observer.observe(scene);observer.observe(root);
  const frame=requestAnimationFrame(onScroll);
  return ()=>{root.removeEventListener("scroll",onScroll);observer.disconnect();cancelAnimationFrame(frame);};
 },[c.scroll,open,reduced]);
 useEffect(()=>{
  if(!open || modal) return;
  const outside=(e:PointerEvent)=>{if(!nav.current?.contains(e.target as Node))setOpen(false);};
  document.addEventListener("pointerdown",outside);
  return ()=>document.removeEventListener("pointerdown",outside);
 },[open,modal]);
 useEffect(()=>{
  if(!open||!modal)return;
  const old=document.body.style.overflow,root=stage.current,previous=root?.style.overflow;
  document.body.style.overflow="hidden";if(root)root.style.overflow="hidden";
  return ()=>{document.body.style.overflow=old;if(root)root.style.overflow=previous??"";};
 },[open,modal]);
 useEffect(()=>{if(group!==null && s.id==="NX11")groupHeading.current?.focus();},[group,s.id]);
 function visit(label:string){setNotice(`Destination preview: ${label}. Routes remain host-owned.`);if(open)close();}
 const destination=(label:string,className="",index?:number)=><a className={className} href={`#${heroId}-destinations`} onClick={()=>visit(label)}>{index!==undefined && <span aria-hidden="true">{String(index+1).padStart(2,"0")}</span>}{label}</a>;
 const brand=<a className={`n3-brand n3-brand--${logo}`} href={`#${heroId}`} aria-label={`${context.brand} home`}>
  {(logo==="symbol"||logo==="combined")&&<svg className="n3-symbol" viewBox="0 0 48 48" aria-hidden="true"><path d={adaptation===2?"M6 6h36v12H18v12h24v12H6V30h24V18H6z":adaptation===1?"M4 4h16v16h8V4h16v40H28V28h-8v16H4z":"M4 40V8h18v12H12v12h24V20H26V8h18v32z"} fill="currentColor"/></svg>}
  {logo==="image" && !broken && !missingLogo ? <img src={`/design-engine-study-003b/${context.id}.svg`} width="360" height="68" alt={context.brand} onError={()=>setBroken(true)}/> : logo!=="symbol" ? <span>{context.brand}</span> : <span className="de-visually-hidden">{context.brand}</span>}
 </a>;
 const menuButton=<button ref={trigger} className="n3-menu-button" type="button" aria-expanded={open} aria-controls={menuId} aria-haspopup={modal?"dialog":undefined} onClick={toggle}><span>{open&&!modal?"Close menu":s.id==="NX08"?"Index":s.id==="NX07"?"All destinations":s.id==="NX11"?"Explore departments":s.id==="NX12"?"Open doors":"Menu"}</span><VigilIcon name={open?"close":"menu"} decorative/></button>;
 const cta=c.cta?destination(context.cta,"n3-cta"):null;
 const utility=<div className="n3-utilities">{s.utilities.filter(u=>u!=="cta"&&c.utilities).map(u=><button key={u} type="button" aria-label={`${u} presentation preview`} onClick={()=>setNotice(`${u}: presentation-only slot. No ${u} service is connected.`)}>{u==="search"?<VigilIcon name="search" decorative/>:u==="account"?<VigilIcon name="user" decorative/>:null}<span>{u==="utility-links"?"Help":u==="locale"?"EN / locale":u==="cart"?"Bag / preview":u}</span></button>)}{cta}</div>;
 function list(items:Destination[],prefix:string){return items.map((l,i)=><div className="n3-link-item" key={l.label}>{l.children?<details onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();e.currentTarget.open=false;e.currentTarget.querySelector("summary")?.focus();}}}><summary>{l.label}<VigilIcon name="chevron-down" decorative/></summary><div className="n3-submenu" id={`${uid}-${prefix}-${i}`}>{destination(`Overview · ${l.label}`)}{l.children.map(child=><span key={child}>{destination(child)}</span>)}</div></details>:destination(l.label)}</div>);}
 const primary=<div className="n3-primary">{list(links,"primary")}</div>;
 let header:ReactNode;
 switch(s.id){
  case "NX02":header=<><div className="n3-service-line"><span>{context.kind}</span>{utility}</div><div className="n3-meridian"><div className="n3-wing">{list(links.slice(0,Math.ceil(links.length/2)),"left")}</div>{brand}<div className="n3-wing">{list(links.slice(Math.ceil(links.length/2)),"right")}</div></div><div className="n3-mobile-priority">{links.slice(0,2).map(l=><span key={l.label}>{destination(l.label)}</span>)}{menuButton}</div></>;break;
  case "NX03":header=<><div className="n3-colophon"><span>{context.kind}</span><span>Independent edition / 2026</span></div><div className="n3-masthead">{brand}{utility}</div><div className="n3-register">{primary}<div className="n3-masthead-priority">{links.slice(0,2).map(l=><span key={l.label}>{destination(l.label)}</span>)}</div>{menuButton}</div></>;break;
  case "NX04":header=<div className="n3-pocket">{brand}<div className="n3-pocket-priorities">{links.slice(0,c.priorityLinks==="three"?3:c.priorityLinks==="two"?2:0).map(l=><span key={l.label}>{destination(l.label)}</span>)}</div>{cta}{menuButton}</div>;break;
  case "NX05":header=<div className="n3-viewfinder">{brand}<span>01 / An introduction</span>{menuButton}</div>;break;
  case "NX06":header=<><div className="n3-service-line">{brand}{utility}</div><div className="n3-department-band">{primary}{menuButton}</div></>;break;
  case "NX07":header=<div className="n3-hall-header">{brand}<div className="n3-priorities">{links.slice(0,2).map(l=><span key={l.label}>{destination(l.label)}</span>)}</div>{menuButton}{cta}</div>;break;
  case "NX08":header=<div className="n3-folio-header">{brand}<span className="n3-context-label">{context.kind}<br/>A continuing index</span>{menuButton}</div>;break;
  case "NX09":header=<div className="n3-rail">{brand}<p className="n3-context-label">{context.kind}</p><div className="n3-rail-links">{links.map((l,i)=><span key={l.label}>{destination(l.label,"",i)}</span>)}</div>{cta}{menuButton}</div>;break;
  case "NX10":header=<div className="n3-threshold-header">{brand}<span className="n3-context-label">{context.kind}</span>{menuButton}{cta}</div>;break;
  case "NX11":header=<div className="n3-channel-header">{brand}{menuButton}{utility}</div>;break;
  case "NX12":header=<div className="n3-doors-header">{brand}<p>Find your way in.</p>{menuButton}{cta}</div>;break;
  default:header=<div className="n3-datum">{brand}{primary}{cta}{menuButton}</div>;
 }
 const panelContent=s.id==="NX11"?<div className="n3-channel-browser" data-depth={group!==null?"children":"parents"}>
  <div className="n3-channel-parents">{links.map((l,i)=><button data-group={i} key={l.label} type="button" aria-pressed={group===i} onClick={()=>setGroup(i)}>{String(i+1).padStart(2,"0")} / {l.label}<VigilIcon name="arrow-right" decorative/></button>)}</div>
  <div className="n3-channel-detail">{group===null?<><h2>Where would you like to go?</h2><p>Select a department to explore its destinations.</p></>:<><button type="button" onClick={()=>{const old=group;setGroup(null);requestAnimationFrame(()=>nav.current?.querySelector<HTMLButtonElement>(`[data-group="${old}"]`)?.focus());}}><VigilIcon name="arrow-left" decorative/>Back to departments</button><h2 ref={groupHeading} tabIndex={-1}>{links[group].label}</h2>{destination(`Overview · ${links[group].label}`)}{links[group].children?.map(child=><span key={child}>{destination(child)}</span>)}<p>{context.note}</p></>}</div>
 </div>:s.id==="NX12"?<div className="n3-doors">{links.map((l,i)=><div key={l.label}>{destination(l.label,"",i)}</div>)}</div>:s.id==="NX07"?<div className="n3-mega"><aside><p>Find your next destination</p><h2>{context.kind}</h2><p>{context.note}</p>{utility}</aside><div className="n3-mega-groups">{links.map(l=><details key={l.label} open><summary>{l.label}<VigilIcon name="chevron-down" decorative/></summary><div>{destination(`Overview · ${l.label}`)}{l.children?.map(child=><span key={child}>{destination(child)}</span>)}</div></details>)}</div></div>:<div className="n3-index"><div className="n3-index-links">{links.map((l,i)=><div key={l.label} className="n3-index-entry"><span className="n3-number" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>{destination(l.label)}{l.children&&<details><summary>Explore {l.label}<VigilIcon name="plus" decorative/></summary><div>{l.children.map(child=><span key={child}>{destination(child)}</span>)}</div></details>}</div>)}</div><aside><p>{context.note}</p>{utility}</aside></div>;
 const heroArtwork=hero==="hero.full-scene"||hero==="hero.scene-poster"?<FullViewportHero kind={hero} alignment={heroAlignment} voice={hero==="hero.scene-poster"?"loud":"subtle"} content={{id:heroId,eyebrow:context.kind,title:context.title,description:context.note,reference:context.brand,caption:"Illustrative brand study / 003B",action:{label:context.cta,href:`#${heroId}-destinations`},image:(heroFixture("hero.comparison",context,heroId) as import("../../composition/schemas").SectionInstance<"hero.comparison">).media.before}}/>:renderSection({...heroFixture(hero,context,heroId),...(hero==="hero.comparison"?{contentAlignment:heroAlignment}:{})});
 const panel=modal?<dialog ref={dialog} id={menuId} className={`n3-panel n3-dialog n3-panel--${s.id}`} aria-labelledby={`${menuId}-title`} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
 if(e.key!=="Tab")return;
 const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href],button,summary,[tabindex="0"]')).filter(el=>el.checkVisibility());
 const first=items[0],last=items[items.length-1];
 if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first)?.focus();}
 }} onClose={()=>{setOpen(false);trigger.current?.focus();}}><div className="n3-panel-top"><h2 id={`${menuId}-title`}>{context.brand} / Destinations</h2><button type="button" onClick={close} autoFocus>Close<VigilIcon name="close" decorative/></button></div>{panelContent}</dialog>:<div hidden={!open} id={menuId} className={`n3-panel n3-panel--${s.id}`}><div className="n3-panel-top"><h2>Explore {context.brand}</h2></div>{panelContent}</div>;
 return <div className="n3-stage" ref={stage} tabIndex={0} aria-label="Scrollable navigation and Hero review" data-study={s.id} data-position={c.position} data-background={c.background} data-contrast={c.contrast} data-density={c.density} data-scroll={c.scroll} data-scrolled={scrolled} data-past-hero={pastHero} data-hero-contrast={c.heroContrast} data-dock-style={c.dockStyle} data-dock-alignment={c.dockAlignment} data-dock-width={c.dockWidth} data-dock-offset={c.dockOffset} data-menu-open={open} data-hidden={hidden&&!open&&!reduced} data-reduced={reduced} data-brand={c.brand} data-primary={c.primary} data-actions={c.actions}>
  <a className="n3-skip" href={`#${heroId}`}>Skip navigation</a>
  <div className="n3-composition">
   <div className="n3-nav-slot"><nav ref={nav} className="n3-navigation" aria-label={`${context.brand} primary navigation`} onFocus={()=>setHidden(false)} onBlur={e=>{if(!modal&&!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==="Escape"&&open){e.preventDefault();e.stopPropagation();close();}}}>{header}{panel}</nav></div><div className="n3-nav-spacer" aria-hidden="true"/>
   <div ref={heroElement} className="n3-hero" id={`${uid}-content`}>{heroArtwork}</div>
   {s.id==="NX10"&&<nav className="n3-threshold-shelf" aria-label="Destination threshold">{links.map((l,i)=><span key={l.label}>{destination(l.label,"",i)}</span>)}</nav>}
  <section className="n3-after" id={`${heroId}-destinations`} tabIndex={-1}><span>Collection 003B / {s.id}</span><h2>Beyond the opening.</h2><p>{context.note}</p><p role="status">{notice||"Follow any destination to inspect its label here. Scroll this artboard to review the navigation behavior."}</p><div className="n3-proof-columns"><p>{s.dna}</p><p>{s.constraints}</p></div><p className="n3-endnote">Fictional adaptation · {context.kind}<br/>Routes, search, account, locale and commerce remain presentation-only.</p></section>
  </div>
 </div>;
}
