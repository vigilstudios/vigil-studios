/** Small, locale-stable formatters shared by both dashboards. */
export function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...options });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "Not available";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Not available";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days} d ago`;
  return formatDate(value);
}

export function formatMoney(cents: number | null | undefined, currency = "usd"): string {
  if (cents === null || cents === undefined) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** "websites.status_changed" → "Website status changed" */
export function humanizeAction(action: string): string {
  const [entity, verb] = action.split(".");
  const e = (entity ?? "").replace(/s$/, "").replace(/_/g, " ");
  const v = (verb ?? "").replace(/_/g, " ");
  const s = `${e} ${v}`.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** URL- and database-safe slug: lowercase, ascii, hyphenated, ≤63 chars. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}
