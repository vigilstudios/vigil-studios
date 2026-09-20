import { createHash } from "node:crypto";
import { DAY_LABELS, parseBrief, type Brief } from "@/lib/vigil/onboarding/brief";
import type { ExtractedDocument } from "./documents";

/**
 * Source snapshots: the customer's inputs, preserved as they were given and
 * kept apart from anything a model writes. Deterministic on purpose — the
 * same brief always renders the same bytes, so a retry commits nothing new
 * and the checksum doubles as the idempotency input.
 */

export type SourceProject = {
  id: string;
  name: string;
  kind: string;
  status: string;
  templateSlug: string | null;
  launchTarget: string | null;
  intakeCompletedAt: string | null;
  brief: unknown;
};

export type SourceOrganization = { id: string; name: string; slug: string };
export type SourceWebsite = { id: string; name: string; templateSlug: string | null };

/** What the manifest knows about a file, as seen by the snapshot (no storage paths). */
export type SourceAssetSummary = { id: string; kind: string; fileName: string; contentType: string; sizeBytes: number; caption: string | null };

export type SourceSnapshot = {
  onboardingRaw: Record<string, unknown>;
  customerBriefMarkdown: string;
  projectRequirements: Record<string, unknown>;
  /** Text layer of customer PDFs, in upload order. Mechanical extraction, not interpretation. */
  documents: ExtractedDocument[];
  /** Internal fields removed from the raw snapshot, listed so the omission is visible. */
  redactions: string[];
  /** sha256 over the raw snapshot, the requirements and the asset list. */
  checksum: string;
  warnings: string[];
};

/** Fields that are internal bookkeeping or private contact data, never source material for a design. */
const REDACTED_PATHS = ["progress", "kickoff", "domain.domainId", "strategy.approver.email"] as const;

export function buildSourceSnapshot(input: {
  organization: SourceOrganization;
  website: SourceWebsite;
  project: SourceProject | null;
  assets: SourceAssetSummary[];
  documents?: ExtractedDocument[];
}): SourceSnapshot {
  const warnings: string[] = [];
  const brief = input.project ? parseBrief(input.project.brief) : parseBrief({});
  if (!input.project) warnings.push("No project is linked to this website; the source snapshot has no onboarding brief.");
  else if (isEmptyBrief(brief)) warnings.push("The onboarding brief is empty; the customer has not completed onboarding yet.");
  else if (!input.project.intakeCompletedAt) warnings.push("The customer has not finished onboarding; the brief may be incomplete.");

  const raw = redact(brief as unknown as Record<string, unknown>, REDACTED_PATHS);
  const requirements = buildRequirements(input.organization, input.website, input.project, brief, input.assets);
  const markdown = renderBriefMarkdown(input.organization.name, brief, input.assets);
  const documents = input.documents ?? [];
  const assetsDigest = input.assets.map((a) => [a.id, a.sizeBytes, a.contentType, a.fileName, a.caption ?? ""]);
  const documentsDigest = documents.map((d) => [d.assetId, sha256(d.text)]);
  const checksum = sha256(stableStringify({ raw, requirements, assets: assetsDigest, documents: documentsDigest }));
  return { onboardingRaw: raw, customerBriefMarkdown: markdown, projectRequirements: requirements, documents, redactions: [...REDACTED_PATHS], checksum, warnings };
}

function isEmptyBrief(brief: Brief): boolean {
  return !brief.basics && !brief.strategy && !brief.offerings && !brief.about && !brief.brand && !brief.domain;
}

function buildRequirements(org: SourceOrganization, website: SourceWebsite, project: SourceProject | null, brief: Brief, assets: SourceAssetSummary[]): Record<string, unknown> {
  const strategy = brief.strategy;
  return {
    organization: { name: org.name, slug: org.slug },
    website: { id: website.id, name: website.name },
    project: project
      ? { id: project.id, name: project.name, kind: project.kind, status: project.status, templateSlug: project.templateSlug ?? website.templateSlug, launchTarget: project.launchTarget, intakeCompleted: Boolean(project.intakeCompletedAt) }
      : null,
    scope: brief.scope ? { summary: brief.scope.summary, items: brief.scope.items } : null,
    goals: strategy ? { primaryGoal: strategy.primaryGoal, success: strategy.success, audience: strategy.audience, targetLaunch: strategy.targetLaunch } : null,
    pages: strategy ? { estimatedCount: strategy.estimatedPageCount, requested: strategy.pages, other: strategy.otherPages } : null,
    features: strategy ? { requested: strategy.features, notes: strategy.featureNotes } : null,
    content: strategy ? { status: strategy.contentStatus } : null,
    references: (strategy?.references ?? []).filter((r) => r.url || r.notes),
    domain: brief.domain ? { answer: brief.domain.answer, hostname: brief.domain.hostname || null, preferredNames: brief.domain.preferredNames } : null,
    brandConstraints: brief.brand ? { avoid: brief.brand.avoid, direction: brief.brand.direction, colours: brief.brand.colours } : null,
    assets: { count: assets.length, byKind: countBy(assets.map((a) => a.kind)) },
  };
}

function renderBriefMarkdown(orgName: string, brief: Brief, assets: SourceAssetSummary[]): string {
  const lines: string[] = [`# Customer brief — ${orgName}`, "", "The customer's onboarding answers, rendered for reading. `onboarding-raw.json` is the same data as stored. Nothing here is interpreted.", ""];
  const section = (title: string) => lines.push(`## ${title}`, "");
  const field = (label: string, value: string | null | undefined) => {
    if (value && value.trim()) lines.push(`**${label}:** ${blockquoteIfMultiline(value.trim())}`, "");
  };
  const bullets = (items: string[]) => {
    for (const item of items) lines.push(`- ${item}`);
    if (items.length) lines.push("");
  };

  const b = brief.basics;
  if (b) {
    section("Business basics");
    field("Business name", b.businessName);
    field("Tagline", b.tagline);
    field("Phone", b.phone);
    field("Email", b.email);
    const address = [b.address.line1, b.address.line2, b.address.city, b.address.region, b.address.postal, b.address.country].filter(Boolean).join(", ");
    field("Address", address);
    if (b.hours.byAppointment) field("Hours", "By appointment");
    else {
      const days = b.hours.days.filter((d) => d.closed || d.open || d.close).map((d) => `${DAY_LABELS[d.day]}: ${d.closed ? "closed" : `${d.open || "?"}–${d.close || "?"}`}`);
      if (days.length) field("Hours", (b.hours.sameEveryDay ? "Same every day. " : "") + days.join("; "));
    }
    field("Hours notes", b.hours.notes);
  }

  const s = brief.strategy;
  if (s) {
    section("Goals and scope");
    field("Primary goal", s.primaryGoal);
    field("What success looks like", s.success);
    field("Audience", s.audience);
    if (s.pages.length) field("Requested pages", s.pages.join(", "));
    field("Other pages", s.otherPages);
    if (s.estimatedPageCount) field("Estimated page count", String(s.estimatedPageCount));
    if (s.features.length) field("Requested features", s.features.join(", "));
    field("Feature notes", s.featureNotes);
    field("Content status", s.contentStatus);
    field("Target launch", s.targetLaunch);
    const refs = s.references.filter((r) => r.url || r.notes);
    if (refs.length) {
      lines.push("**References:**", "");
      bullets(refs.map((r) => [r.url, r.notes].filter(Boolean).join(" — ")));
    }
    field("Notes", s.notes);
  }

  const o = brief.offerings;
  if (o && (o.sections.some((sec) => sec.items.length) || o.notes)) {
    section(`What they offer (${o.noun})`);
    for (const sec of o.sections) {
      if (!sec.items.length) continue;
      if (sec.name) lines.push(`### ${sec.name}`, "");
      bullets(sec.items.map((item) => [item.name, item.price ? `(${item.price})` : "", item.description ? `— ${item.description}` : ""].filter(Boolean).join(" ")));
    }
    field("Notes", o.notes);
  }

  const a = brief.about;
  if (a) {
    section("About");
    field("Story", a.story);
    field("What makes them different", a.different);
    field("A sentence for the hero", a.hero);
  }

  const br = brief.brand;
  if (br) {
    section("Brand");
    const colours = br.colours.mode === "logo" ? "Use the logo's colours" : br.colours.mode === "vigil" ? "Vigil chooses" : [br.colours.primary, br.colours.secondary].filter(Boolean).join(", ") || "Customer picks (none given)";
    field("Colours", colours);
    field("Direction", br.direction);
    field("Avoid", br.avoid);
    field("Notes", br.notes);
    const social = Object.entries(br.social).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
    if (social.length) field("Social", social.join("; "));
  }

  const d = brief.domain;
  if (d && d.answer) {
    section("Domain");
    field("Answer", d.answer === "own" ? "Owns a domain" : d.answer === "need" ? "Needs a domain" : "Not sure");
    field("Hostname", d.hostname);
    if (d.preferredNames.length) field("Preferred names", d.preferredNames.join(", "));
  }

  if (brief.scope && (brief.scope.summary || brief.scope.items.length)) {
    section("Agreed scope (staff-written)");
    field("Summary", brief.scope.summary);
    bullets(brief.scope.items);
  }

  section("Files supplied");
  if (assets.length === 0) lines.push("None.", "");
  else bullets(assets.map((f) => `${f.fileName} (${f.kind}, ${f.contentType}, ${formatKb(f.sizeBytes)})${f.caption ? ` — ${f.caption}` : ""}`));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function blockquoteIfMultiline(value: string): string {
  return value.includes("\n") ? `\n\n> ${value.replace(/\n/g, "\n> ")}` : value;
}

function formatKb(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function countBy(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/** Remove dotted paths from a plain object tree (copy; the input is untouched). */
export function redact(value: Record<string, unknown>, paths: readonly string[]): Record<string, unknown> {
  const copy = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  for (const path of paths) {
    const parts = path.split(".");
    let node: unknown = copy;
    for (const part of parts.slice(0, -1)) {
      node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
    }
    if (node && typeof node === "object") delete (node as Record<string, unknown>)[parts[parts.length - 1]];
  }
  return copy;
}

/** JSON with sorted object keys, so equal data means equal bytes. */
export function stableStringify(value: unknown, indent = 0): string {
  return JSON.stringify(sortKeys(value), null, indent);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]));
  }
  return value;
}

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}
