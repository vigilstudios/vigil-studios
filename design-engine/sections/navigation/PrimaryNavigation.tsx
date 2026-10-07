"use client";
import { PrimaryAction } from "../../actions/SectionActions";

import { useId, useRef, useState } from "react";
import { BrandMark, type NavigationLogo } from "./BrandMark";
import { VigilIcon } from "../../icons/VigilIcon";
import { DesignContainer } from "../../primitives/DesignContainer";

export type PrimaryNavigationProps = {
  brand: string;
  logo?: NavigationLogo;
  home?: string;
  links: readonly { label: string; href: string }[];
  action?: { label: string; href: string };
  density?: "compact" | "comfortable";
};

export function PrimaryNavigation({ brand, logo, home = "#top", links, action, density = "comfortable" }: PrimaryNavigationProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <nav className={`de-nav de-nav--${density}`} aria-label="Primary navigation" onKeyDown={event => { if (event.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } }}>
      <DesignContainer className="de-nav__inner">
        <a className="de-nav__brand de-navigation-brand" href={home} aria-label={`${brand} home`}><BrandMark brand={brand} logo={logo}/></a>
        <button ref={trigger} className="de-nav__menu-button" type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
          <VigilIcon name={open ? "close" : "menu"} decorative /><span className="de-visually-hidden">{open ? "Close menu" : "Open menu"}</span>
        </button>
        <div id={menuId} className={`de-nav__links ${open ? "de-nav__links--open" : ""}`}>
          {links.map((link) => <a key={`${link.href}-${link.label}`} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
          <PrimaryAction fallback={action} onClick={() => setOpen(false)}/>
        </div>
      </DesignContainer>
    </nav>
  );
}
