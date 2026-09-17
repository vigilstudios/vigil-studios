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

/**
 * Customer-facing fallback when an older row missed an automatic lifecycle
 * update. Reliable delivery events always outrank an earlier stored stage.
 */
export function effectiveProjectStatus(
  stored: ProjectStatus,
  signals: { intakeCompleted?: boolean; previewReady?: boolean; websiteLive?: boolean }
): ProjectStatus {
  if (stored === "closed" || stored === "cancelled") return stored;
  if (signals.websiteLive) return "launched";
  const storedIndex = projectSteps.findIndex((step) => step.key === stored);
  const minimum = signals.previewReady ? "review" : signals.intakeCompleted ? "in_progress" : stored;
  const minimumIndex = projectSteps.findIndex((step) => step.key === minimum);
  return minimumIndex > storedIndex ? minimum : stored;
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

export type PreviewSource = { kind: "live" | "template"; src: string; address: string } | { kind: "none" };

const templateHtmlSlugs = new Set(EXPRESS_TEMPLATES.map((t) => t.slug));

/**
 * What the site preview should show: the live site once it has a real
 * address, otherwise the Express template it is built from, otherwise
 * nothing. Placeholder hosts from the in-memory provider never embed.
 */
export function previewSource(website: { live_url: string | null; preview_url: string | null; template_slug: string | null; status: string } | null, fallbackSlug: string | null = null): PreviewSource {
  const candidate = website?.status === "live" ? website.live_url : website?.preview_url ?? null;
  if (candidate) {
    try {
      const u = new URL(candidate);
      const placeholder = u.hostname.endsWith(".local") || u.hostname.endsWith(".invalid") || u.hostname === "localhost";
      if ((u.protocol === "https:" || u.protocol === "http:") && !placeholder) {
        return { kind: "live", src: u.toString(), address: u.hostname };
      }
    } catch {
      /* fall through to the template */
    }
  }
  const slug = website?.template_slug ?? fallbackSlug;
  if (slug && templateHtmlSlugs.has(slug)) {
    return { kind: "template", src: `/express-templates/${slug}.html`, address: `${slug}.preview` };
  }
  return { kind: "none" };
}
