"use client";
import { useSectionActions } from "../../actions/ActionContext";
import { NavigationMotion } from "../../presentation/NavigationMotion";
import { PrimaryAction } from "../../actions/SectionActions";
import "./reveal.css";
import "./palette.css";
import "./solidify.css";
import "./hierarchy.css";
import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
  type RefObject,
} from "react";
import { BrandMark } from "./BrandMark";
import { VigilIcon } from "../../icons/VigilIcon";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import {
  architectureFor,
  defaultNavigationConfig,
  type ExpansionNavigationId,
} from "../../navigation/capabilities";
import type {
  NavigationPayload,
  NavigationDestination,
} from "../../navigation/schemas";
import type {
  NavigationArchitecture,
  NavigationConfig,
} from "../../navigation/types";
export type NavigationSection = NavigationPayload & {
  id: string;
  component: ExpansionNavigationId;
};
export type NavigationParts = {
  brand: ReactNode;
  primary: ReactNode;
  utility: ReactNode;
  cta: ReactNode;
  menuButton: ReactNode;
  links: NavigationDestination[];
  content: NavigationPayload["content"];
  config: NavigationConfig;
  architecture: NavigationArchitecture;
  destination: (
    label: string,
    className?: string,
    index?: number,
    href?: string,
  ) => ReactNode;
  list: (items: NavigationDestination[], prefix: string) => ReactNode;
  group: number | null;
  setGroup: (value: number | null) => void;
  groupHeading: RefObject<HTMLHeadingElement | null>;
  back: () => void;
};
export function NavigationShell({
  section,
  Header,
  Panel,
}: {
  section: NavigationSection;
  Header: ComponentType<NavigationParts>;
  Panel: ComponentType<NavigationParts>;
}) {
  const contextual = useSectionActions();
  const content = section.content,
    s = architectureFor(section.component),
    c = {
      ...defaultNavigationConfig(s),
      ...section.settings,
    } as NavigationConfig;
  const links = content.links as NavigationDestination[],
    uid =
      "nx-" +
      useId()
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase(),
    menuId = `${uid}-menu`;
  const stage = useRef<HTMLDivElement>(null),
    nav = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    groupHeading = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(false),
    [group, setGroup] = useState<number | null>(null),
    [scrolled, setScrolled] = useState(false),
    [pastHero, setPastHero] = useState(false),
    [hidden, setHidden] = useState(false);
  const { systemReduced } = useMotionPolicy();
  const modal = ["NX02", "NX03", "NX05", "NX08", "NX09"].includes(s.id);
  const close = () => {
    setOpen(false);
    if (modal) dialog.current?.close();
    trigger.current?.focus();
  };
  const toggle = () => {
    if (open) close();
    else {
      setGroup(null);
      setOpen(true);
      if (modal) dialog.current?.showModal();
    }
  };
  useLayoutEffect(() => {
    const root = stage.current,
      header = nav.current;
    if (!root || !header) return;
    let closedHeight = 0;
    const measure = () => {
      if (!root.checkVisibility()) return;
      const height = header.offsetHeight;
      if (!root.dataset.scrolled || root.dataset.scrolled === "false")
        closedHeight = height;
      closedHeight = Math.max(closedHeight, height);
      root.style.setProperty("--de-nx-header-height", `${closedHeight}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    const composition = root.closest<HTMLElement>(".de-composition"),
      geometry = root.closest<HTMLElement>(".de-composition-geometry"),
      scene = composition?.querySelector<HTMLElement>("[data-hero-section]");
    let ancestor = root.parentElement;
    while (
      ancestor &&
      !/(auto|scroll)/.test(getComputedStyle(ancestor).overflowY)
    )
      ancestor = ancestor.parentElement;
    const target: HTMLElement | Window = ancestor ?? window;
    const viewportTop = () =>
      target instanceof Window ? 0 : target.getBoundingClientRect().top + target.clientTop;
    const scale = () =>
      geometry ? geometry.getBoundingClientRect().width / geometry.offsetWidth || 1 : 1;
    const offset = () =>
      geometry
        ? Math.max(0, (viewportTop() - geometry.getBoundingClientRect().top) / scale())
        : target instanceof Window ? window.scrollY : target.scrollTop;
    let previous = offset(),
      travel = 0,
      frame = 0;
    const update = () => {
      frame = 0;
      if (!root.checkVisibility()) return;
      const y = offset(),
        delta = y - previous,
        top = viewportTop();
      // Native sticky owns position. Accumulate deliberate movement so slow scrolling
      // works, while trackpad jitter cannot repeatedly reverse a running transition.
      if (delta) travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      setScrolled((was) => y > 72 ? true : y < 56 ? false : was);
      setPastHero(!scene || scene.getBoundingClientRect().bottom <= top + 1);
      const expanded = Array.from(
        nav.current?.querySelectorAll("details[open]") ?? [],
      ).some((detail) => detail.checkVisibility());
      setHidden((was) =>
        c.scroll !== "reveal" ||
        systemReduced ||
        open ||
        expanded ||
        y < 140 ||
        nav.current?.contains(document.activeElement)
          ? false
          : travel > 12
            ? true
            : travel < -8
              ? false
              : was,
      );
      previous = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    target.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    if (scene) observer.observe(scene);
    observer.observe(root);
    if (target instanceof HTMLElement) observer.observe(target);
    // Zoom and audition visibility changes need a fresh Hero/direction measurement.
    const transforms = new MutationObserver(schedule);
    for (
      let parent = root.parentElement;
      parent && parent !== ancestor;
      parent = parent.parentElement
    ) {
      const attributes = parent.classList.contains("lab-artboard")
        ? ["style", "hidden"] : ["hidden"];
      // Audition dismissal can restore visibility without a new scroll/resize event.
      transforms.observe(parent, { attributes: true, attributeFilter: attributes });
    }
    schedule();
    return () => {
      target.removeEventListener("scroll", schedule);
      observer.disconnect();
      transforms.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [c.scroll, c.position, open, systemReduced]);
  useEffect(() => {
    if (!open || modal) return;
    const outside = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, modal]);
  useEffect(() => {
    if (!open || !modal) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [open, modal]);
  useEffect(() => {
    if (group !== null && s.id === "NX11") groupHeading.current?.focus();
  }, [group, s.id]);
  const destination = (
    label: string,
    className = "",
    index?: number,
    href = content.home,
  ) => (
    <a
      className={className}
      href={href}
      onClick={() => {
        if (open) close();
      }}
    >
      {index !== undefined && (
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      )}
      {label}
    </a>
  );
  const logo = content.logo ?? {kind:"wordmark"};
  const brand = <a className={`de-nx-brand de-nx-brand--${logo.kind}`} href={content.home} aria-label={`${content.brand} home`}><BrandMark brand={content.brand} logo={logo}/></a>;
  const menuButton = (
    <button
      ref={trigger}
      className="de-nx-menu-button"
      type="button"
      aria-expanded={open}
      aria-controls={menuId}
      aria-haspopup={modal ? "dialog" : undefined}
      onClick={toggle}
    >
      <span>
        {open && !modal
          ? "Close menu"
          : s.id === "NX08"
            ? "Index"
            : s.id === "NX07"
              ? "All destinations"
              : s.id === "NX11"
                ? "Explore departments"
                : s.id === "NX12"
                  ? "Open doors"
                  : "Menu"}
      </span>
      <VigilIcon name={open ? "close" : "menu"} decorative />
    </button>
  );
  const cta = c.cta || contextual.section?.contextualActions?.primary?.enabled ? <PrimaryAction fallback={content.action} className="de-nx-cta" onClick={() => { if (open) close(); }}/> : null;
  const utility = (
    <div className="de-nx-utilities">
      {c.utilities &&
        content.utilities?.map((u) => (
          <a key={u.kind} href={u.href} className="de-nx-utility">
            {u.kind === "search" ? (
              <VigilIcon name="search" decorative />
            ) : u.kind === "account" ? (
              <VigilIcon name="user" decorative />
            ) : null}
            {u.label}
          </a>
        ))}
      {cta}
    </div>
  );
  function list(items: NavigationDestination[], prefix: string) {
    return items.map((l, i) => (
      <div className="de-nx-link-item" key={l.label}>
        {l.children ? (
          <details
            onKeyDown={(e) => {
              if (e.key === "Escape" && e.currentTarget.open) {
                e.stopPropagation();
                e.currentTarget.open = false;
                e.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>
              {l.label}
              <VigilIcon name="chevron-down" decorative />
            </summary>
            <div className="de-nx-submenu" id={`${uid}-${prefix}-${i}`}>
              {destination(l.label, "", undefined, l.href)}
              {list(l.children, `${prefix}-${i}`)}
            </div>
          </details>
        ) : (
          destination(l.label, "", undefined, l.href)
        )}
      </div>
    ));
  }
  const primary = <div className="de-nx-primary">{list(links, "primary")}</div>;

  const back = () => {
    const old = group;
    setGroup(null);
    requestAnimationFrame(() =>
      nav.current
        ?.querySelector<HTMLButtonElement>(`[data-group="${old}"]`)
        ?.focus(),
    );
  };
  const parts: NavigationParts = {
    brand,
    primary,
    utility,
    cta,
    menuButton,
    links,
    content,
    config: c,
    architecture: s,
    destination,
    list,
    group,
    setGroup,
    groupHeading,
    back,
  };
  const panel = modal ? (
    <dialog
      ref={dialog}
      id={menuId}
      className={`de-nx-panel de-nx-dialog de-nx-panel--${s.id}`}
      aria-labelledby={`${menuId}-title`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href],button,summary,[tabindex="0"]',
          ),
        ).filter((el) => el.checkVisibility());
        const first = items[0],
          last = items[items.length - 1];
        if (
          (e.shiftKey && document.activeElement === first) ||
          (!e.shiftKey && document.activeElement === last)
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }}
      onClose={() => {
        setOpen(false);
        trigger.current?.focus();
      }}
    >
      <div className="de-nx-panel-top">
        <h2 id={`${menuId}-title`}>{content.brand} / Destinations</h2>
        <button type="button" onClick={close} autoFocus>
          Close
          <VigilIcon name="close" decorative />
        </button>
      </div>
      <Panel {...parts} />
    </dialog>
  ) : (
    <div
      hidden={!open}
      id={menuId}
      className={`de-nx-panel de-nx-panel--${s.id}`}
    >
      <div className="de-nx-panel-top">
        <h2>Explore {content.brand}</h2>
      </div>
      <Panel {...parts} />
    </div>
  );
  return (
    <div
      className="de-navigation-system"
      ref={stage}
      data-study={s.id}
      data-position={c.position}
      data-background={c.background}
      data-contrast={c.contrast}
      data-density={c.density}
      data-scroll={c.scroll}
      data-scrolled={scrolled}
      data-past-hero={pastHero}
      data-hero-contrast={c.heroContrast}
      data-dock-style={s.floating ? c.dockStyle : undefined}
      data-dock-alignment={s.floating ? c.dockAlignment : undefined}
      data-dock-width={s.floating ? c.dockWidth : undefined}
      data-dock-offset={s.floating ? c.dockOffset : undefined}
      data-menu-open={open}
      data-hidden={hidden && !open && !systemReduced}
      data-reduced={systemReduced}
      data-motion-disabled={systemReduced}
      data-brand={c.brand}
      data-primary={c.primary}
      data-actions={c.actions}
    >
      <div className="de-nx-nav-slot">
        <NavigationMotion>
        <nav
          ref={nav}
          className="de-nx-navigation"
          aria-label={`${content.brand} primary navigation`}
          onFocus={() => setHidden(false)}
          onBlur={(e) => {
            if (!modal && !e.currentTarget.contains(e.relatedTarget)) {
              if (e.relatedTarget) setOpen(false);
              else
                requestAnimationFrame(() => {
                  if (
                    nav.current &&
                    !nav.current.contains(document.activeElement)
                  )
                    setOpen(false);
                });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && open) {
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
        >
          <Header {...parts} />
          {panel}
        </nav>
        </NavigationMotion>
      </div>
      <div className="de-nx-nav-spacer" aria-hidden="true" />
    </div>
  );
}

export function IndexPanel({
  links,
  destination,
  content,
  utility,
}: NavigationParts) {
  return (
    <div className="de-nx-index">
      <div className="de-nx-index-links">
        {links.map((l, i) => (
          <div key={l.label} className="de-nx-index-entry">
            <span className="de-nx-number" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            {destination(l.label, "", undefined, l.href)}
            {l.children && (
              <details>
                <summary>
                  Explore {l.label}
                  <VigilIcon name="plus" decorative />
                </summary>
                <div>
                  {l.children.map((child) => (
                    <span key={child.label}>
                      {destination(child.label, "", undefined, child.href)}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
      <aside>
        <p>{content.note}</p>
        {utility}
      </aside>
    </div>
  );
}

export function DirectoryPanel({
  links,
  destination,
  content,
  utility,
  list,
}: NavigationParts) {
  return (
    <div className="de-nx-mega">
      <aside>
        <p>Find your next destination</p>
        <h2>{content.kind}</h2>
        <p>{content.note}</p>
        {utility}
      </aside>
      <div className="de-nx-mega-groups">
        {links.map((l) => (
          <details key={l.label} open>
            <summary>
              {l.label}
              <VigilIcon name="chevron-down" decorative />
            </summary>
            <div>
              {destination(l.label, "", undefined, l.href)}
              {l.children ? list(l.children, `directory-${l.href}`) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export function DoorsPanel({ links, destination, utility }: NavigationParts) {
  return (
    <>
      <div className="de-nx-doors">
        {links.map((l, i) => (
          <div key={l.label}>{destination(l.label, "", i, l.href)}</div>
        ))}
      </div>
      <div className="de-nx-doors-utilities">{utility}</div>
    </>
  );
}

export function StagedPanel({
  links,
  destination,
  content,
  group,
  setGroup,
  groupHeading,
  back,
  list,
}: NavigationParts) {
  return (
    <div
      className="de-nx-channel-browser"
      data-depth={group !== null ? "children" : "parents"}
    >
      <div className="de-nx-channel-parents">
        {links.map((l, i) => (
          <button
            data-group={i}
            key={l.label}
            type="button"
            aria-pressed={group === i}
            onClick={() => setGroup(i)}
          >
            {String(i + 1).padStart(2, "0")} / {l.label}
            <VigilIcon name="arrow-right" decorative />
          </button>
        ))}
      </div>
      <div className="de-nx-channel-detail">
        {group === null ? (
          <>
            <h2>Where would you like to go?</h2>
            <p>Select a department to explore its destinations.</p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                back();
              }}
            >
              <VigilIcon name="arrow-left" decorative />
              Back to departments
            </button>
            <h2 ref={groupHeading} tabIndex={-1}>
              {links[group].label}
            </h2>
            {destination(links[group].label, "", undefined, links[group].href)}
            {links[group].children ? list(links[group].children, `department-${group}`) : null}
            <p>{content.note}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function ThresholdShelf({ section }: { section: NavigationSection }) {
  return (
    <nav className="de-nx-threshold-shelf" aria-label="Destination threshold">
      {section.content.links.map((l, i) => (
        <span key={l.label}>
          <a href={l.href}>
            <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            {l.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
