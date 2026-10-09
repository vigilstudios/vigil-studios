"use client";
import { PrimaryAction } from "../../actions/SectionActions";
import { NavigationMotion } from "../../presentation/NavigationMotion";
import { useEffect, useId, useRef, useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { BrandMark } from "./BrandMark";
import { VigilIcon } from "../../icons/VigilIcon";

export function IslandNavigation({ content: c, structure }: SectionInstance<"navigation.island">) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return <NavigationMotion><nav ref={root} className={`de-island-nav de-island-nav--${structure}`} aria-label="Primary navigation"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => { if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } }}>
    <a className="de-island-nav__brand de-accent de-navigation-brand" href={c.home} aria-label={`${c.brand} home`}><BrandMark brand={c.brand} logo={c.logo}/></a>
    <div className="de-island-nav__immediate">{c.links.slice(0, 2).map(link => <a className="de-accent" key={link.href} href={link.href}>{link.label}</a>)}</div>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}><VigilIcon name={open ? "close" : "menu"} decorative /><span className="de-visually-hidden">{open ? "Close menu" : "Open menu"}</span></button>
    <div id={menuId} className="de-island-nav__panel" hidden={!open}>{c.links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<PrimaryAction fallback={c.action} onClick={() => setOpen(false)}/></div>
  </nav></NavigationMotion>;
}
