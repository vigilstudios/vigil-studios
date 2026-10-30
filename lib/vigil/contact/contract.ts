import { z } from "zod";

export const CONTACT_BODY_LIMIT = 16_384;
const singleLine = (max: number) => z.string().trim().max(max).refine(value => !/[\r\n\x00-\x08]/.test(value), "Use a single line.");
export const contactSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  captchaToken: z.string().min(1).max(2048),
  name: singleLine(120).refine(value => value.length > 0),
  email: z.string().trim().email().max(254),
  phone: singleLine(80).optional(),
  message: z.string().trim().min(1).max(5000).refine(value => !/\x00/.test(value)),
  source: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/).default("inquiries"),
  sourcePage: z.string().max(2048),
  details: z.record(z.string().regex(/^[a-z][a-z0-9-]{0,79}$/), singleLine(500)).prefault({})
    .refine(value => Object.keys(value).length <= 8),
}).strict();
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
export type PublicContactConfig = { websiteId: string; siteKey: string; bookingUrl: string | null };
export const leadStatuses = ["new", "contacted", "qualified", "booked", "won", "lost", "spam"] as const;

/** Booking is a navigation destination, never an arbitrary script, iframe or private-network URL. */
export function validBookingUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") &&
      /^[a-z0-9.-]+$/i.test(url.hostname) && url.hostname.includes(".") &&
      !/^\d+(\.\d+){3}$/.test(url.hostname) && !/(^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname);
  } catch { return false; }
}
export function registeredOrigin(origin: string | null): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.origin === origin && !url.username && !url.password ? origin : null;
  } catch { return null; }
}
