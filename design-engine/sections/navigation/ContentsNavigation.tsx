"use client";
import { PrimaryAction } from "../../actions/SectionActions";
import { NavigationMotion } from "../../presentation/NavigationMotion";
import { useEffect, useId, useRef, useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { BrandMark } from "./BrandMark";
import { VigilIcon } from "../../icons/VigilIcon";

export function ContentsNavigation({ content: c, structure }: SectionInstance<"navigation.contents">) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const close = () => dialog.current?.close();
  return <NavigationMotion><nav className="de-contents-nav" aria-label="Primary navigation">
    <a className="de-accent de-navigation-brand" href={c.home} aria-label={`${c.brand} home`}><BrandMark brand={c.brand} logo={c.logo}/></a><span className="de-mono">{c.edition}</span>
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => { dialog.current?.showModal(); setOpen(true); }}>Contents <VigilIcon name="menu" decorative /></button>
    <dialog ref={dialog} id={id} className="de-contents-nav__sheet" aria-labelledby={`${id}-title`} onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <div className="de-contents-nav__sheet-header"><h2 id={`${id}-title`} className="de-heading">{c.brand}</h2><button type="button" onClick={close} autoFocus><VigilIcon name="close" decorative /><span className="de-visually-hidden">Close contents</span></button></div>
      <div className="de-contents-nav__columns"><ol className="de-contents-nav__destinations">{c.links.map((link, index) => <li key={link.href}>{structure === "numbered" ? <span className="de-mono" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span> : null}<a className="de-heading" href={link.href} onClick={close}>{link.label}</a></li>)}</ol>
        <aside><p className="de-text">{c.note}</p><PrimaryAction fallback={c.action} onClick={close}/></aside>
      </div>
    </dialog>
  </nav></NavigationMotion>;
}
