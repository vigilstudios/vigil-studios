"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Globe,
  Link2,
  SlidersHorizontal,
  Table2,
  Users,
  X,
} from "lucide-react";

/** Give the schedule the remaining screen, rather than adding a second page of calendar. */
export function BookingViewport({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () => {
      let bottomSpace = 12;
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        bottomSpace += Number.parseFloat(style.paddingBottom) || 0;
        if (["auto", "scroll"].includes(style.overflowY)) break;
      }
      element.style.setProperty(
        "--booking-height",
        `${Math.max(260, window.innerHeight - element.getBoundingClientRect().top - bottomSpace)}px`,
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div className="booking-viewport" ref={root}>
      {children}
    </div>
  );
}

export function BookingRecordWorkspace({
  children,
  selected,
  detail,
}: {
  children: ReactNode;
  selected?: string;
  detail: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const requested = useRef(false);
  useEffect(() => {
    const linked =
      selected &&
      new URL(location.href).searchParams.get("appointment") === selected &&
      window.matchMedia("(max-width: 760px)").matches;
    if (requested.current || linked) {
      if (!dialog.current?.open) dialog.current?.showModal();
      requested.current = false;
    }
  }, [selected]);
  return (
    <div
      className="booking-records"
      onClickCapture={(e) => {
        if (
          !(e.target instanceof Element) ||
          !e.target.closest(".booking-record") ||
          !window.matchMedia("(max-width: 760px)").matches
        )
          return;
        const link = e.target.closest("a") as HTMLAnchorElement | null;
        if (
          link &&
          new URL(link.href).searchParams.get("appointment") === selected
        )
          dialog.current?.showModal();
        else requested.current = true;
      }}
    >
      {children}
      <dialog
        className="bc-detail-dialog"
        ref={dialog}
        aria-label="Appointment details"
      >
        <button
          className="bc-dialog-close"
          type="button"
          aria-label="Close appointment details"
          onClick={() => dialog.current?.close()}
        >
          <X size={18} />
        </button>
        {detail}
      </dialog>
    </div>
  );
}

const sections = [
  {
    id: "rules",
    label: "Booking rules",
    description: "Timezone & online bookings",
    icon: SlidersHorizontal,
  },
  {
    id: "people",
    label: "People & hours",
    description: "Who is available, and when",
    icon: Users,
  },
  {
    id: "tables",
    label: "Tables & dining hours",
    description: "Restaurant reservations",
    icon: Table2,
  },
  {
    id: "services",
    label: "Services",
    description: "What customers can book",
    icon: CalendarDays,
  },
  {
    id: "time-off",
    label: "Time off",
    description: "Holidays & blocked dates",
    icon: Clock3,
  },
  {
    id: "widget",
    label: "Website widget",
    description: "Your customer experience",
    icon: Globe,
  },
  {
    id: "connections",
    label: "Connections",
    description: "Optional calendar sync",
    icon: Link2,
  },
] as const;

/** Panels stay mounted so switching setup sections preserves in-progress form values. */
export function BookingSetupWorkspace({
  panels,
  initial = "rules",
}: {
  panels: ReactNode[];
  initial?: string;
}) {
  const [active, setActive] = useState(
    sections.some((s) => s.id === initial) ? initial : "rules",
  );
  const prefix = useId();
  const selected = sections.find((s) => s.id === active)!;
  return (
    <BookingViewport>
      <div className="booking-setup-workspace">
        <label className="booking-setup-mobile-nav">
          Setup section
          <select value={active} onChange={(e) => setActive(e.target.value)}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Booking setup sections" className="booking-setup-nav">
          <span className="booking-eyebrow">SETUP</span>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={active === s.id ? "true" : undefined}
              aria-controls={`${prefix}-${s.id}`}
              onClick={() => setActive(s.id)}
            >
              <s.icon size={17} />
              <span>
                <strong>{s.label}</strong>
                <small>{s.description}</small>
              </span>
            </button>
          ))}
          <p>
            Appointment services reserve a person or space. Dining services
            assign an available table that fits the party.
          </p>
        </nav>
        <div className="booking-setup-content">
          <header className="booking-section-heading">
            <div>
              <h2>{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <span className="booking-draft-note">
              Save changes in each form
            </span>
          </header>
          {sections.map((s, i) => (
            <div
              key={s.id}
              id={`${prefix}-${s.id}`}
              hidden={active !== s.id}
              className="booking-setup-panel"
            >
              {panels[i]}
            </div>
          ))}
        </div>
      </div>
    </BookingViewport>
  );
}

export function BookingDiningPanels({
  tables,
  hours,
}: {
  tables: ReactNode;
  hours: ReactNode;
}) {
  const [view, setView] = useState<"tables" | "hours">("tables");
  return (
    <>
      <div className="bc-toolbar">
        <div className="bc-modes" role="group" aria-label="Restaurant setup">
          <button
            type="button"
            aria-pressed={view === "tables"}
            onClick={() => setView("tables")}
          >
            Tables
          </button>
          <button
            type="button"
            aria-pressed={view === "hours"}
            onClick={() => setView("hours")}
          >
            Dining hours
          </button>
        </div>
      </div>
      <div hidden={view !== "tables"}>{tables}</div>
      <div hidden={view !== "hours"}>{hours}</div>
    </>
  );
}

export function BookingEditorCollection({
  items,
  add,
}: {
  items: {
    id: string;
    name: string;
    description: string;
    content: ReactNode;
  }[];
  add?: ReactNode;
}) {
  const [selected, setSelected] = useState(items[0]?.id ?? "new");
  return (
    <div className="booking-editor-collection">
      <nav aria-label="Choose an item to edit" className="booking-editor-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={selected === item.id ? "true" : undefined}
            onClick={() => setSelected(item.id)}
          >
            <strong>{item.name}</strong>
            <small>{item.description}</small>
          </button>
        ))}
        {add && (
          <button
            type="button"
            className="booking-add"
            aria-current={selected === "new" ? "true" : undefined}
            onClick={() => setSelected("new")}
          >
            + Add new
          </button>
        )}
      </nav>
      <div className="booking-editor-body">
        {items.map((item) => (
          <div key={item.id} hidden={selected !== item.id}>
            {item.content}
          </div>
        ))}
        {add && <div hidden={selected !== "new"}>{add}</div>}
        {!items.length && !add && (
          <p className="lead-settings-note">
            There are no items to manage yet.
          </p>
        )}
      </div>
    </div>
  );
}
