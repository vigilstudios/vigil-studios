import { z } from "zod";

export const BOOKING_FEATURE = "bookings.enabled";
export const bookingModes = ["instant", "approval"] as const;
export const bookingStatuses = [
  "requested",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
  "expired",
] as const;
export const bookingExperienceSchema = z
  .object({
    presentation: z.enum(["inline", "popup"]),
    datePicker: z.enum(["calendar", "date"]),
    showResource: z.boolean(),
    resourceLabel: z.string().trim().min(1).max(30),
    title: z.string().trim().min(1).max(80),
    introduction: z.string().trim().max(160),
    buttonLabel: z.string().trim().min(1).max(40),
    accent: z.enum(["royal", "graphite", "plum"]),
  })
  .strict();
export type BookingExperience = z.infer<typeof bookingExperienceSchema>;
export const defaultBookingExperience: BookingExperience = {
  presentation: "inline",
  datePicker: "calendar",
  showResource: false,
  resourceLabel: "Person or space",
  title: "Choose a time",
  introduction: "Find an appointment that works for you.",
  buttonLabel: "Book an appointment",
  accent: "royal",
};
export function bookingExperience(value: unknown): BookingExperience {
  const result = bookingExperienceSchema.safeParse(value);
  return result.success ? result.data : defaultBookingExperience;
}
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    if (value !== "UTC" && !value.includes("/")) return false;
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose an IANA timezone such as America/New_York.");
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const hoursSchema = z
  .array(
    z
      .object({ day: z.number().int().min(0).max(6), start: time, end: time })
      .strict()
      .refine(
        (v) => v.start < v.end,
        "Opening time must precede closing time.",
      ),
  )
  .max(28)
  .refine(
    (rows) =>
      rows.every((row, i) =>
        rows.every(
          (other, j) =>
            i === j ||
            row.day !== other.day ||
            row.end <= other.start ||
            other.end <= row.start,
        ),
      ),
    "Availability windows must not overlap.",
  );
export const bookingSettingsSchema = z
  .object({
    timeZone: timeZoneSchema,
    enabled: z.boolean(),
    acknowledgeAvailability: z.boolean(),
    minimumNotice: z.number().int().min(0).max(43200),
    horizonDays: z.number().int().min(1).max(180),
    changeNotice: z.number().int().min(0).max(10080),
  })
  .strict();
export const resourceSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1).max(120),
    active: z.boolean(),
    hours: hoursSchema,
  })
  .strict();
export const bookingServiceSchema = z
  .object({
    id: z.uuid().optional(),
    resourceId: z.uuid(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(600),
    duration: z
      .number()
      .int()
      .min(15)
      .max(480)
      .refine((v) => v % 15 === 0),
    bufferBefore: z
      .number()
      .int()
      .min(0)
      .max(120)
      .refine((v) => v % 15 === 0),
    bufferAfter: z
      .number()
      .int()
      .min(0)
      .max(120)
      .refine((v) => v % 15 === 0),
    mode: z.enum(bookingModes),
    active: z.boolean(),
  })
  .strict();
export const publicBookingSchema = z
  .object({
    sourcePage: z.url().max(2048),
    serviceId: z.uuid(),
    startsAt: z.iso.datetime(),
    submissionId: z.uuid(),
    managementToken: z.string().regex(/^[a-f0-9]{64}$/),
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254),
    phone: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional(),
    captchaToken: z.string().min(1).max(4096),
  })
  .strict();
export const guestBookingSchema = z
  .object({
    bookingId: z.uuid(),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    action: z.enum(["read", "cancel", "reschedule"]),
    startsAt: z.iso.datetime().optional(),
  })
  .strict()
  .refine(
    (v) => v.action !== "reschedule" || !!v.startsAt,
    "Choose a new time.",
  );
export type PublicBookingService = {
  id: string;
  name: string;
  description: string;
  duration: number;
  mode: (typeof bookingModes)[number];
  resourceId?: string;
  resourceName?: string;
};
export type PublicBookingConfig = {
  websiteId: string;
  businessName: string;
  timeZone: string;
  siteKey: string;
  services: PublicBookingService[];
  experience?: BookingExperience;
  minDate?: string;
  maxDate?: string;
};
export type BookingReceipt = {
  id: string;
  serviceId: string;
  status: (typeof bookingStatuses)[number];
  startsAt: string;
  endsAt: string;
  timeZone: string;
  serviceName: string;
  requestedStart: string | null;
  changeDeadline: string;
  expiresAt: string | null;
};
export type BookingSlot = { startsAt: string; endsAt: string };
export function bookingTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}
/** Guest credentials belong in fragments, never analytics/query parameters. */
export function bookingManagementUrl(
  pageUrl: string,
  id: string,
  token: string,
) {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = `vigil-booking=${id}.${token}`;
  return url.toString();
}
