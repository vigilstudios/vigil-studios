import type { Tone } from "@/components/vigil/ui";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import type { ProjectStatus } from "./types";

/**
 * Small pure helpers that turn rows into widget props. Kept out of the
 * components so they can be unit-tested.
 */

export const projectSteps: { key: ProjectStatus; label: string }[] = [
  { key: "draft", label: "Kick-off" },
  { key: "intake", label: "Your details" },
  { key: "in_progress", label: "Build" },
  { key: "review", label: "Your review" },
  { key: "approved", label: "Approved" },
  { key: "launched", label: "Live" },
];

/** Index into projectSteps for the stepper; terminal states map sensibly. */
export function projectStepIndex(status: ProjectStatus): { current: number; done: boolean; cancelled: boolean } {
  if (status === "cancelled") return { current: -1, done: false, cancelled: true };
  if (status === "closed") return { current: projectSteps.length - 1, done: true, cancelled: false };
  const i = projectSteps.findIndex((s) => s.key === status);
  return { current: i, done: status === "launched", cancelled: false };
}

/** Where we are in the billing period, for the subscription meter. */
export function periodProgress(start: string | null, end: string | null, now = Date.now()): { elapsed: number; total: number; daysLeft: number | null } {
  if (!start || !end) return { elapsed: 0, total: 0, daysLeft: null };
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return { elapsed: 0, total: 0, daysLeft: null };
  const total = e - s;
  const elapsed = Math.max(0, Math.min(total, now - s));
  const daysLeft = Math.max(0, Math.ceil((e - now) / 86_400_000));
  return { elapsed, total, daysLeft };
}

/** Tone for an audit action, so the timeline can carry an icon. */
export function auditTone(action: string, after: unknown): Tone {
  const status = typeof after === "object" && after !== null && "status" in after ? String((after as { status: unknown }).status) : null;
  if (status) {
    if (["live", "connected", "active", "launched", "approved", "delivered", "succeeded"].includes(status)) return "good";
    if (["error", "suspended", "expired", "unpaid", "failed", "declined", "cancelled", "canceled"].includes(status)) return "bad";
    if (["past_due", "paused", "verifying", "review", "pending"].includes(status)) return "warn";
    return "info";
  }
  if (action.endsWith(".created") || action.endsWith(".added") || action.endsWith(".invited") || action.endsWith(".submitted")) return "info";
  if (action.includes("removed") || action.includes("revoked") || action.includes("left")) return "neutral";
  return "neutral";
}

export type RequiredRecord = { type: string; name: string; value: string };

export function requiredRecords(verification: unknown): RequiredRecord[] {
  if (typeof verification !== "object" || verification === null) return [];
  const list = (verification as { required_records?: unknown }).required_records;
  return Array.isArray(list) ? (list as RequiredRecord[]) : [];
}

/** Human name for an Express template slug; falls back to the slug itself. */
export function templateName(slug: string | null): string {
  if (!slug) return "Custom";
  return EXPRESS_TEMPLATES.find((t) => t.slug === slug)?.industry ?? slug;
}
