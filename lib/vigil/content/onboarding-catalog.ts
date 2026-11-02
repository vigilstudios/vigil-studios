import "server-only";
import { createHash } from "node:crypto";
import type { DbClient } from "@/lib/vigil/types";
import type { Json } from "@/types/database.types";
import { ValidationError } from "@/lib/vigil/auth/errors";
import { parseBrief, type Offerings, type Brand } from "@/lib/vigil/onboarding/brief";
import { IMAGE_ACCEPT, MAX_PHOTOS } from "@/lib/vigil/onboarding/assets";
import { parseRecords, payloadSchemas, type ContentRecord } from "./contract";
import type { BoundCollection } from "./professional";

const stableId = (value: string) => {
  const h = createHash("sha256").update(value).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
export const offeringModule = (noun: Offerings["noun"]) => noun === "services" || noun === "other" ? "services" : "products";
export const offeringLabel = (noun: Offerings["noun"]) => ({ services: "Services", products: "Products", menu: "Menu", other: "Offerings" })[noun];

/** Stable item IDs preserve assignments even if names, groups or order change. No signed URLs are stored. */
export function offeringRecords(project: string, offerings: Offerings): ContentRecord[] {
  const contentModule = offeringModule(offerings.noun);
  const records = offerings.sections.flatMap(section => section.items.filter(item => item.name.trim()).map(item => {
    const id = stableId(`${project}:${section.id}:${item.id}`);
    return {
      id, slug: `item-${id}`, deleted: false, featured: false,
      data: payloadSchemas[contentModule].parse({ title: item.name, description: item.description, category: section.name, priceLabel: item.price,
        media: [...new Set(item.imageAssetIds)].map(id => ({ id, type: "image", src: "", alt: item.name, caption: "" })),
      }),
    };
  }));
  return parseRecords(contentModule, records);
}

/**
 * Import an explicit, completed item catalogue once, without touching any delivered
 * collection or subsequent Hub edits. Called only inside an authorized authoring
 * flow. The normal Files rows, storage bytes and quota are reused.
 */
export async function ensureOnboardingCatalog(admin: DbClient, website: string, org: string): Promise<void> {
  const { data: site, error: siteError } = await admin.from("websites").select("project_id").eq("id", website).eq("organization_id", org).maybeSingle();
  if (siteError) throw siteError;
  if (!site?.project_id) return;
  const { data: project, error: projectError } = await admin.from("projects").select("id,brief,intake_completed_at").eq("id", site.project_id).eq("organization_id", org).maybeSingle();
  if (projectError) throw projectError;
  if (!project?.intake_completed_at) return;
  const brief = parseBrief(project.brief);
  if (brief.offerings) {
    const records = offeringRecords(project.id, brief.offerings);
    if (records.length) await importOnboardingCollection(admin, website, org, project.id, offeringModule(brief.offerings.noun), offeringLabel(brief.offerings.noun), records);
  }
  if (brief.brand?.team.enabled) {
    const records = teamRecords(project.id, brief.brand.team);
    if (records.length) await importOnboardingCollection(admin, website, org, project.id, "team", "The team", records);
  }
}

export function teamRecords(project: string, team: Brand["team"]): ContentRecord[] {
  if (!team.enabled) return [];
  return parseRecords("team", team.members.filter(member => member.name.trim()).map(member => {
    const id = stableId(`${project}:team:${member.id}`);
    return { id, slug: `member-${id}`, deleted: false, featured: false, data: payloadSchemas.team.parse({ title: member.name, role: member.role, description: member.bio, media: member.imageAssetIds.map(id => ({ id, type: "image", src: "", alt: member.name, caption: "" })) }) };
  }));
}

async function importOnboardingCollection(admin: DbClient, website: string, org: string, projectId: string, contentModule: "team" | "services" | "products", label: string, records: ContentRecord[]): Promise<void> {
  const key = `onboarding-${contentModule === "team" ? "team" : "offerings"}-${projectId}`;
  const { data: existing, error } = await admin.from("website_content_collections").select("*").eq("website_id", website).eq("organization_id", org).eq("module", contentModule);
  if (error) throw error;
  // A verified delivered collection or an existing import owns its content.
  const awaiting = existing?.filter(c => (c.config as Record<string, unknown>).awaitingIntake === true && c.updated_by === null && c.published_revision === null && c.revision === 1) ?? [];
  if (existing?.length && awaiting.length !== 1) return;
  const ids = [...new Set(records.flatMap(record => "media" in record.data ? record.data.media.flatMap(media => media.id ? [media.id] : []) : []))];
  if (ids.length) {
    const { data: assets, error: assetError } = await admin.from("project_assets").select("id,bucket_id,object_path,content_type,size_bytes").eq("organization_id", org).eq("project_id", projectId).in("id", ids);
    if (assetError) throw assetError;
    for (const id of ids) {
      const asset = assets?.find(a => a.id === id);
      if (!asset || !["project-assets", "content-media"].includes(asset.bucket_id) || !asset.object_path.startsWith(`${org}/${projectId}/`) || !IMAGE_ACCEPT.split(",").includes(asset.content_type)) throw new ValidationError("An item image is missing from this website's Files. Contact Vigil to reconnect it.");
      const { data: info, error: infoError } = await admin.storage.from(asset.bucket_id).info(asset.object_path);
      if (infoError || !info || Number(info.size) !== asset.size_bytes || info.contentType !== asset.content_type) throw new ValidationError("An item image has not finished uploading. Please try again.");
      const { error: registrationError } = await admin.from("website_content_media").upsert({ id, website_id: website, organization_id: org, type: "image", ready: true }, { onConflict: "id", ignoreDuplicates: true });
      if (registrationError) throw registrationError;
      const { data: registered, error: registeredError } = await admin.from("website_content_media").select("id").eq("id", id).eq("website_id", website).eq("organization_id", org).eq("ready", true).maybeSingle();
      if (registeredError) throw registeredError;
      if (!registered) throw new ValidationError("An item image is already connected to another website.");
    }
  }
  if (awaiting.length === 1) {
    const current = awaiting[0];
    const original: BoundCollection = { id: current.id, binding: { version: 1, key: current.key, module: contentModule, label: current.label, pageId: current.page_id, sectionId: current.section_id, field: current.field, adapter: "professional" }, config: current.config as unknown as BoundCollection["config"], records: parseRecords(contentModule, current.draft), revision: current.revision, publishedRevision: null };
    const linked = connectOnboardingCatalog({ ...original, records, binding: { ...original.binding, label: label }, config: { ...original.config, catalogSource: projectId } }, original);
    const { error: updateError } = await admin.from("website_content_collections").update({ draft: records as unknown as Json, label: label, config: { ...linked.config, awaitingIntake: false } as unknown as Json, revision: 2 }).eq("id", current.id).eq("website_id", website).eq("organization_id", org).eq("revision", 1).is("updated_by", null);
    if (updateError) throw updateError;
    return;
  }
  const { error: insertError } = await admin.from("website_content_collections").upsert({
    website_id: website, organization_id: org, key, module: contentModule, label: label,
    page_id: "onboarding", section_id: projectId, field: contentModule === "team" ? "members" : "offerings", adapter: "standalone",
    config: { templates: {}, sourceIds: {}, catalogSource: projectId, deliveryPending: true, maxMedia: contentModule === "team" ? 1 : MAX_PHOTOS, hasDetailLinks: false, editableFields: contentModule === "team" ? ["title", "role", "description", "media"] : ["title", "description", "category", "priceLabel", "media"] } as Json,
    draft: records as unknown as Json,
  }, { onConflict: "website_id,key", ignoreDuplicates: true });
  if (insertError) throw insertError;
}

/** Connect only an unambiguous actual delivered section. No publication is implied. */
export function connectOnboardingCatalog(pending: BoundCollection, discovered: BoundCollection): BoundCollection {
  const normalize = (name: string) => name.trim().toLocaleLowerCase();
  const templates: BoundCollection["config"]["templates"] = {}, sourceIds: Record<string, string> = {};
  for (const row of pending.records) {
    const match = discovered.records.find(r => normalize(r.data.title) === normalize(row.data.title));
    const template = match ? discovered.config.templates[match.id] : Object.values(discovered.config.templates)[0];
    if (template) templates[row.id] = template;
    sourceIds[row.id] = match ? discovered.config.sourceIds[match.id] : `item-${row.id}`;
  }
  return { ...pending, binding: { ...discovered.binding, label: pending.binding.label }, config: {
    ...discovered.config, templates, sourceIds, catalogSource: pending.config.catalogSource, maxMedia: pending.binding.module === "team" ? 1 : MAX_PHOTOS,
    primaryMediaOnly: discovered.config.maxMedia === 1 && Boolean(discovered.config.editableFields?.includes("media")), deliveryPending: false,
    editableFields: pending.binding.module === "team" ? ["title", "role", "description", "media"] : [...new Set([...(discovered.config.editableFields ?? []), "media", "priceLabel", "category"])],
  } };
}
