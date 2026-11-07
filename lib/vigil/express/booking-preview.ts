/** Public catalogue presentation only. Exports retain contact fallback and explicit Care+ activation. */
import { BOOKING_RUNTIME_VERSION } from "../bookings/runtime-version.mjs";
export function bookingPreviewHtml(
  html: string,
  kind: "restaurant" | "salon" | "home" | "auto",
) {
  if (!html.includes('data-vigil-booking-slot="v1"')) return html;
  if (kind === "restaurant")
    html = html.replaceAll(
      "For reservations or group visits, please call us.",
      "For larger parties or special requests, please call us.",
    );
  const disclosure =
    '<p class="vigil-booking-plan-note">Online booking is optional with Vigil Care or higher, after setup. Without Care+, this section defaults to a contact form. This is an interactive example; no appointment is saved.</p>';
  html = html.replace(
    '<div data-vigil-booking-slot="v1" hidden></div>',
    '<div class="vigil-express-calendar" data-vigil-booking-preview="v1"></div>' +
      disclosure,
  );
  const styles =
    `<link rel="stylesheet" href="/integrations/vigil-bookings-v1.css?v=${BOOKING_RUNTIME_VERSION}"><style>[data-vigil-booking-compatible="v1"] #booking-form,[data-vigil-booking-compatible="v1"] #request-form,[data-vigil-booking-compatible="v1"]>.preview-note,[data-vigil-booking-compatible="v1"]>h3{display:none!important}.vigil-express-calendar{container-type:inline-size;padding:24px;background:var(--color-surface,#fff);color:var(--color-text,#182238);border:1px solid var(--color-border,#d8dce6);border-radius:14px;min-width:0}.vigil-booking-plan-note{font:inherit;font-size:12px;line-height:1.7;margin:18px 0 0;max-width:65ch}.vigil-express-calendar .vigil-booking h3{font:inherit;font-size:26px;letter-spacing:-.03em}.vigil-express-calendar .vb-scheduler{grid-template-columns:minmax(140px,.7fr) minmax(220px,1fr);gap:20px}.vigil-express-calendar .vb-options{padding-right:18px}.vigil-express-calendar .vigil-booking button{font-family:inherit;text-transform:none;letter-spacing:normal}@container(max-width:480px){.vigil-express-calendar .vb-scheduler{grid-template-columns:1fr}.vigil-express-calendar .vb-options{border-right:0;border-bottom:1px solid currentColor;padding:0 0 18px}}@media(max-width:1000px){.vigil-express-calendar .vb-scheduler{grid-template-columns:1fr}.vigil-express-calendar .vb-options{border-right:0;border-bottom:1px solid currentColor;padding:0 0 18px}}</style>`;
  const script = `<script src="/integrations/vigil-bookings-v1.js?v=${BOOKING_RUNTIME_VERSION}" defer></script><script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('[data-vigil-booking-preview="v1"]').forEach(function(slot){VigilBookings.preview(slot,${JSON.stringify(kind)});});});</script>`;
  return html
    .replace("</head>", styles + "</head>")
    .replace("</body>", script + "</body>");
}
