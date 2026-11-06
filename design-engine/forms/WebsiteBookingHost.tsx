"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { TurnstileVerification } from "./WebsiteContactHost";
import {
  bookingManagementUrl,
  bookingTime,
  bookingExperience,
  type BookingExperience,
  type BookingReceipt,
  type BookingSlot,
  type PublicBookingConfig,
} from "@/lib/vigil/bookings/contract";
import { BookingDatePicker } from "./BookingDatePicker";
import { dayStart } from "@/lib/vigil/bookings/calendar";
import "./bookings.css";
const Host = createContext<{ endpoint?: string; preview: boolean }>({
  preview: true,
});
export function WebsiteBookingHost({
  contactEndpoint,
  preview = false,
  children,
}: {
  contactEndpoint?: string;
  preview?: boolean;
  children: ReactNode;
}) {
  const endpoint = contactEndpoint?.replace(
    /\/api\/contact\//,
    "/api/bookings/",
  );
  return (
    <Host.Provider value={{ endpoint, preview: preview || !endpoint }}>
      {children}
    </Host.Provider>
  );
}
const fictionalSlots: BookingSlot[] = [
  { startsAt: "2030-11-04T15:00:00Z", endsAt: "2030-11-04T15:30:00Z" },
  { startsAt: "2030-11-04T17:00:00Z", endsAt: "2030-11-04T17:30:00Z" },
];
const fictionalConfig: PublicBookingConfig = {
  websiteId: "preview",
  businessName: "Example business",
  timeZone: "America/New_York",
  siteKey: "",
  services: [
    {
      id: "example-instant",
      name: "Follow-up call",
      description: "A short conversation with your team.",
      duration: 30,
      mode: "instant",
      resourceId: "example-alex",
      resourceName: "Alex",
    },
    {
      id: "example-service",
      name: "Consultation",
      description: "A conversation about your next step.",
      duration: 30,
      mode: "approval",
      resourceId: "example-jordan",
      resourceName: "Jordan",
    },
  ],
};
function localDay(zone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
async function read<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: body ? "POST" : "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Bookings are unavailable. Please contact the business.",
    );
  return data;
}
export function BookingWidget({
  title,
  introduction,
  headingLevel = "h3",
  endpoint: boundEndpoint,
  preview: boundPreview,
  experience: boundExperience,
}: {
  headingLevel?: "h2" | "h3";
  title?: string;
  introduction?: string;
  endpoint?: string;
  preview?: boolean;
  experience?: BookingExperience;
}) {
  const Heading = headingLevel;
  const host = useContext(Host),
    endpoint = boundEndpoint ?? host.endpoint,
    preview = boundPreview ?? host.preview;
  const [config, setConfig] = useState<PublicBookingConfig | null>(
      preview ? fictionalConfig : null,
    ),
    [service, setService] = useState(preview ? "example-service" : ""),
    [day, setDay] = useState(preview ? "2030-11-04" : ""),
    [slotResult, setSlotResult] = useState<{
      key: string;
      slots: BookingSlot[];
    }>({ key: "", slots: [] }),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [captchaRevision, setCaptchaRevision] = useState(0),
    [receipt, setReceipt] = useState<BookingReceipt | null>(null),
    [manageUrl, setManageUrl] = useState(""),
    [guest, setGuest] = useState<{ bookingId: string; token: string } | null>(
      null,
    ),
    [message, setMessage] = useState(""),
    [resource, setResource] = useState(""),
    [step, setStep] = useState<"time" | "details">("time");
  const experience = boundExperience ?? bookingExperience(config?.experience);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (receipt && experience.presentation === "popup" && !dialog.current?.open)
      dialog.current?.showModal();
  }, [receipt, experience.presentation]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step === "details")
      root.current
        ?.querySelector<HTMLInputElement>('input[name="name"]')
        ?.focus();
  }, [step]);
  const initialReceipt = useRef<BookingReceipt | null>(null);
  const retry = useRef<{
    fingerprint: string;
    id: string;
    token: string;
  } | null>(null);
  useEffect(() => {
    if (preview) return;
    if (!endpoint) return;
    let cancelled = false;
    // Fragments are never sent to the server or analytics. Only this widget reads its credential.
    const match = location.hash.match(
      /^#vigil-booking=([a-f0-9-]{36})\.([a-f0-9]{64})$/,
    );
    if (match)
      root.current?.scrollIntoView({ block: "start", behavior: "auto" });
    const load = match
      ? read<{ appointment: BookingReceipt }>(endpoint, {
          bookingId: match[1],
          token: match[2],
          action: "read",
        }).then((result) => {
          if (cancelled) return;
          initialReceipt.current = result.appointment;
          setService(result.appointment.serviceId);
          setGuest({ bookingId: match[1], token: match[2] });
          setReceipt(result.appointment);
          setManageUrl(location.href);
        })
      : Promise.resolve();
    load.catch((failure) => {
      if (!cancelled) setError(failure.message);
    });
    read<PublicBookingConfig>(endpoint)
      .then((value) => {
        if (!cancelled) {
          setConfig(value);
          setService(
            initialReceipt.current?.serviceId ?? value.services[0]?.id ?? "",
          );
          setDay(localDay(value.timeZone));
        }
      })
      .catch((failure) => {
        if (!cancelled && !match) setError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, preview]);
  useEffect(() => {
    if (preview || !service || !day || !endpoint) return;
    let cancelled = false;
    const key = `${service}:${day}`;
    read<{ slots: BookingSlot[] }>(
      `${endpoint}?service=${encodeURIComponent(service)}&day=${encodeURIComponent(day)}`,
    )
      .then((value) => {
        if (!cancelled) {
          setSlotResult({ key, slots: value.slots });
          setError("");
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setError(failure.message);
          setSlotResult({ key, slots: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, preview, service, day]);
  const queryKey = `${service}:${day}`,
    slots = preview
      ? fictionalSlots.map((slot, index) => {
          const start = new Date(
            Date.parse(
              dayStart(day || "2030-11-04", fictionalConfig.timeZone),
            ) +
              (10 + index * 2) * 3600000,
          );
          return {
            startsAt: start.toISOString(),
            endsAt: new Date(
              start.getTime() +
                (config?.services.find((s) => s.id === service)?.duration ??
                  30) *
                  60000,
            ).toISOString(),
          };
        })
      : slotResult.key === queryKey
        ? slotResult.slots
        : [],
    loading = !preview && !!service && !!day && slotResult.key !== queryKey;
  const chosen = config?.services.find((value) => value.id === service);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "details") {
      if (selected) setStep("details");
      return;
    }
    if (busy || !selected || !config) return;
    if (preview) {
      setMessage("Preview only. No appointment was requested or saved.");
      return;
    }
    if (!endpoint || !token) {
      setError("Complete the verification before booking.");
      return;
    }
    const form = new FormData(event.currentTarget),
      contact = {
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone") ?? ""),
        notes: String(form.get("notes") ?? ""),
      };
    const fingerprint = JSON.stringify([service, selected, contact]);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = {
        fingerprint,
        id: crypto.randomUUID(),
        token:
          crypto.randomUUID().replaceAll("-", "") +
          crypto.randomUUID().replaceAll("-", ""),
      };
    const pending = retry.current;
    setBusy(true);
    setError("");
    try {
      const result = await read<{ appointment: BookingReceipt }>(endpoint, {
        sourcePage: location.origin + location.pathname,
        serviceId: service,
        startsAt: selected,
        submissionId: pending.id,
        managementToken: pending.token,
        ...contact,
        captchaToken: token,
      });
      setReceipt(result.appointment);
      setGuest({ bookingId: result.appointment.id, token: pending.token });
      setManageUrl(
        bookingManagementUrl(
          location.href,
          result.appointment.id,
          pending.token,
        ),
      );
      retry.current = null;
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Please try again.",
      );
    } finally {
      setBusy(false);
      setToken("");
      setCaptchaRevision((v) => v + 1);
    }
  }
  async function manage(action: "cancel" | "reschedule") {
    if (!guest || !endpoint || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await read<{ appointment: BookingReceipt }>(endpoint, {
        ...guest,
        action,
        ...(action === "reschedule" ? { startsAt: selected } : {}),
      });
      setReceipt(result.appointment);
      setMessage(
        action === "cancel"
          ? "Appointment cancelled."
          : result.appointment.requestedStart
            ? "New time requested. Your current appointment remains reserved until the business approves the change."
            : "Appointment updated.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Please contact the business.",
      );
    } finally {
      setBusy(false);
    }
  }
  const chooseDay = (next: string) => {
    setDay(next);
    setSelected("");
    setError("");
  };
  const resourceOptions = [
    ...new Map(
      config?.services
        .filter((s) => s.resourceId && s.resourceName)
        .map((s) => [s.resourceId!, s.resourceName!]),
    ).entries(),
  ];
  const content = (
    <>
      <header>
        <Heading>{title ?? experience.title}</Heading>
        <p>{introduction ?? experience.introduction}</p>
      </header>
      {preview && (
        <p className="vb-note">Interactive example · no live appointments</p>
      )}
      {!config && !receipt && !error && (
        <p role="status">Loading booking options…</p>
      )}
      {receipt ? (
        <section aria-label="Your appointment" className="vb-receipt">
          <strong>
            {receipt.status === "requested"
              ? "Request received · awaiting approval"
              : receipt.status === "confirmed"
                ? "Appointment confirmed"
                : receipt.status.replaceAll("_", " ")}
          </strong>
          <p>{receipt.serviceName}</p>
          <p>{bookingTime(receipt.startsAt, receipt.timeZone)}</p>
          {receipt.status === "requested" && (
            <p>
              Your time is not reserved until the business confirms it. Requests
              expire{" "}
              {receipt.expiresAt
                ? bookingTime(receipt.expiresAt, receipt.timeZone)
                : "after review"}
              .
            </p>
          )}
          {receipt.requestedStart && (
            <p>
              Requested change:{" "}
              {bookingTime(receipt.requestedStart, receipt.timeZone)}
            </p>
          )}
          <p className="vb-note">
            Save your private management link. No email or calendar invitation
            has been sent.
          </p>
          <a href={manageUrl} referrerPolicy="no-referrer">
            Your private appointment link
          </a>
          {guest && ["requested", "confirmed"].includes(receipt.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void manage("cancel")}
            >
              Cancel appointment
            </button>
          )}
        </section>
      ) : null}
      {config &&
        (!receipt || ["requested", "confirmed"].includes(receipt.status)) && (
          <form onSubmit={submit}>
            <div className="vb-scheduler" hidden={step !== "time" && !receipt}>
              <aside className="vb-options">
                <span className="vb-step-label">
                  01 / CHOOSE YOUR APPOINTMENT
                </span>
                {experience.showResource && resourceOptions.length > 0 && (
                  <label>
                    {experience.resourceLabel}
                    <select
                      value={resource}
                      disabled={!!receipt}
                      onChange={(e) => {
                        const id = e.target.value;
                        setResource(id);
                        if (id && chosen?.resourceId !== id)
                          setService(
                            config.services.find((s) => s.resourceId === id)
                              ?.id ?? "",
                          );
                        setSelected("");
                        setError("");
                      }}
                    >
                      <option value="">All options</option>
                      {resourceOptions.map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Service
                  <select
                    value={service}
                    onChange={(e) => {
                      setService(e.target.value);
                      setSelected("");
                      setError("");
                    }}
                    disabled={!!receipt}
                  >
                    {config.services
                      .filter(
                        (s) =>
                          !experience.showResource ||
                          !resource ||
                          s.resourceId === resource,
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.duration} min
                        </option>
                      ))}
                  </select>
                </label>
                {chosen?.description && (
                  <p className="vb-note">{chosen.description}</p>
                )}
                <p className="vb-duration">
                  {chosen?.duration} minutes ·{" "}
                  {chosen?.mode === "approval"
                    ? "Approval required"
                    : "Instant confirmation"}
                </p>
                <p className="vb-note">
                  Times shown in {config.timeZone.replaceAll("_", " ")}.
                </p>
              </aside>
              <div className="vb-calendar-and-times">
                {experience.datePicker === "calendar" ? (
                  <BookingDatePicker
                    value={day}
                    min={
                      preview
                        ? "2030-11-01"
                        : (config.minDate ?? localDay(config.timeZone))
                    }
                    max={preview ? "2031-11-01" : config.maxDate}
                    onChange={chooseDay}
                  />
                ) : (
                  <label>
                    Date
                    <input
                      type="date"
                      value={day}
                      min={
                        preview
                          ? "2030-11-01"
                          : (config.minDate ?? localDay(config.timeZone))
                      }
                      max={config.maxDate}
                      onChange={(e) => chooseDay(e.target.value)}
                      required
                    />
                  </label>
                )}
                {loading ? (
                  <p role="status">Loading available times…</p>
                ) : (
                  <fieldset>
                    <legend>
                      {receipt ? "Choose a new time" : "Available times"}
                    </legend>
                    <div className="vb-slots">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          aria-pressed={selected === slot.startsAt}
                          key={slot.startsAt}
                          onClick={() => setSelected(slot.startsAt)}
                        >
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: config.timeZone,
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(slot.startsAt))}
                        </button>
                      ))}
                    </div>
                    {!slots.length && (
                      <p>
                        No available times. Try another date or contact the
                        business.
                      </p>
                    )}
                  </fieldset>
                )}
              </div>
            </div>
            {receipt ? (
              <button
                type="button"
                disabled={busy || !selected}
                onClick={() => void manage("reschedule")}
              >
                Request a time change
              </button>
            ) : (
              <>
                {step === "time" && (
                  <button
                    type="button"
                    className="vb-continue"
                    disabled={!selected || loading}
                    onClick={() => setStep("details")}
                  >
                    Continue to your details →
                  </button>
                )}
                <div
                  className="vb-customer-details"
                  hidden={step !== "details"}
                >
                  <button
                    type="button"
                    className="vb-back"
                    onClick={() => setStep("time")}
                  >
                    ← Change appointment
                  </button>
                  <span className="vb-step-label">02 / YOUR DETAILS</span>
                  <strong>{chosen?.name}</strong>
                  {selected && <p>{bookingTime(selected, config.timeZone)}</p>}
                  <p className="vb-note">
                    {chosen?.mode === "approval"
                      ? "This service requires approval. A request does not reserve the time."
                      : "Your appointment is confirmed when it is saved successfully."}
                  </p>
                  <div className="vb-fields">
                    <label>
                      Your name
                      <input
                        name="name"
                        disabled={step !== "details"}
                        autoComplete="name"
                        maxLength={120}
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        name="email"
                        disabled={step !== "details"}
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        required
                      />
                    </label>
                    <label>
                      Phone (optional)
                      <input
                        name="phone"
                        disabled={step !== "details"}
                        type="tel"
                        autoComplete="tel"
                        maxLength={40}
                      />
                    </label>
                    <label>
                      Notes (optional)
                      <textarea
                        name="notes"
                        disabled={step !== "details"}
                        maxLength={2000}
                        rows={2}
                      />
                    </label>
                  </div>
                  {!preview && config.siteKey && (
                    <TurnstileVerification
                      key={captchaRevision}
                      siteKey={config.siteKey}
                      action="booking"
                      onToken={setToken}
                    />
                  )}
                  <button
                    type="submit"
                    disabled={busy || !selected || (!preview && !token)}
                  >
                    {busy
                      ? "Saving…"
                      : chosen?.mode === "approval"
                        ? "Request appointment"
                        : "Confirm appointment"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
  return (
    <div
      ref={root}
      className="vigil-booking"
      data-vigil-booking-component="v1"
      data-accent={experience.accent}
    >
      {experience.presentation === "popup" ? (
        <>
          <button
            type="button"
            className="vb-launch"
            onClick={() => dialog.current?.showModal()}
          >
            {experience.buttonLabel}
          </button>
          <dialog
            ref={dialog}
            className="vb-dialog"
            aria-label={title ?? experience.title}
          >
            <button
              type="button"
              className="vb-close"
              aria-label="Close booking"
              onClick={() => dialog.current?.close()}
            >
              ×
            </button>
            {content}
          </dialog>
        </>
      ) : (
        content
      )}
    </div>
  );
}
