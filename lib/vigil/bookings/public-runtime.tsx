import { createRoot } from "react-dom/client";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
/** Catalogue examples are fictional and never fetch a website or create an appointment. */
export function preview(
  element: HTMLElement,
  kind: "restaurant" | "salon" | "home" | "auto" = "salon",
) {
  const root = createRoot(element);
  root.render(<BookingWidget preview previewKind={kind} />);
  return () => root.unmount();
}
export function mount(element: HTMLElement, websiteId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(websiteId)) throw new Error("Invalid website.");
  const root = createRoot(element);
  root.render(
    <BookingWidget
      endpoint={`https://www.vigilstudios.co/api/bookings/${websiteId}`}
      preview={false}
    />,
  );
  return () => root.unmount();
}
/** Contact stays visible unless the authoritative server says this website is enabled and eligible. */
export async function connect(
  element: HTMLElement,
  websiteId: string,
  prechecked = false,
) {
  if (!/^[0-9a-f-]{36}$/i.test(websiteId)) return;
  try {
    const management = /^#vigil-booking=[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(
      location.hash,
    );
    if (!prechecked && !management) {
      const response = await fetch(
        `https://www.vigilstudios.co/api/bookings/${websiteId}`,
        {
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) return;
      const config = await response.json();
      if (!Array.isArray(config.services) || !config.services.length) return;
    }
    element.hidden = false;
    const panel = element.closest('[data-vigil-booking-compatible="v1"]');
    panel
      ?.querySelectorAll<HTMLElement>(
        "form#booking-form, form#request-form, h3, .preview-note",
      )
      .forEach((node) => (node.hidden = true));
    return mount(element, websiteId);
  } catch {
    /* Keep the contact fallback when paused, ineligible or unavailable. */
  }
}
