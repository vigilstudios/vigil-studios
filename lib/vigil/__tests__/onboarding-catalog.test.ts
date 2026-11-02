import { describe, expect, it, vi } from "vitest";
import { offeringsSchema } from "../onboarding/brief";
import { offeringRecords, offeringModule, offeringLabel, ensureOnboardingCatalog, connectOnboardingCatalog } from "../content/onboarding-catalog";
import { assertOfferingImages } from "../services/offering-images";
import { FakeAdmin } from "./fake-admin";
import type { BoundCollection } from "../content/professional";

const org = "org-a", project = "project-a", website = "website-a";
const a = "ad000000-0000-4000-8000-000000000001", b = "ad000000-0000-4000-8000-000000000002";
const offers = () => offeringsSchema.parse({ noun: "products", sections: [{ id: "group", name: "Skincare", items: [{ id: "item", name: "Serum", description: "Daily care", price: "$20", imageAssetIds: [a, b] }] }] });
function fixture() {
  const fake = new FakeAdmin({ websites: [{ id: website, organization_id: org, project_id: project }], projects: [{ id: project, organization_id: org, intake_completed_at: "2026-10-27", brief: { offerings: offers() } }], project_assets: [a, b].map(id => ({ id, project_id: project, organization_id: org, bucket_id: "project-assets", object_path: `${org}/${project}/${id}.png`, content_type: "image/png", size_bytes: 123 })) });
  const info = vi.fn().mockResolvedValue({ data: { size: 123, contentType: "image/png" }, error: null });
  Object.assign(fake, { storage: { from: () => ({ info }) } });
  return { fake, info, db: fake.asClient() };
}
describe("onboarding item images and Content Hub handoff", () => {
  it("reads legacy items without images and rejects duplicate or invalid file IDs", () => {
    expect(offeringsSchema.parse({ sections: [{ id: "g", items: [{ id: "a", name: "Service" }] }] }).sections[0].items[0].imageAssetIds).toEqual([]);
    const value = offers(); value.sections[0].items[0].imageAssetIds = [a, a];
    expect(offeringsSchema.safeParse(value).success).toBe(false);
    value.sections[0].items[0].imageAssetIds = ["https://untrusted.test/image.png"];
    expect(offeringsSchema.safeParse(value).success).toBe(false);
  });
  it("maps products/menu and services/other into real supported modules", () => {
    expect(["products", "menu", "services", "other"].map(noun => offeringModule(noun as "products"))).toEqual(["products", "products", "services", "services"]);
    expect(offeringLabel("menu")).toBe("Menu");
  });
  it("keeps item identity and full media order through a rename", () => {
    const value = offers(), first = offeringRecords(project, value)[0];
    value.sections[0].items[0].name = "Renamed serum";
    const next = offeringRecords(project, value)[0];
    expect(next.id).toBe(first.id);
    expect(next.slug).toBe(first.slug);
    expect(next.data).toMatchObject({ category: "Skincare", priceLabel: "$20", media: [{ id: a, src: "" }, { id: b, src: "" }] });
  });
  it("accepts only images in this organization and project", async () => {
    const f = fixture();
    await expect(assertOfferingImages(f.db, org, project, offers())).resolves.toBeUndefined();
    f.fake.rows("project_assets")[1].organization_id = "other-org";
    await expect(assertOfferingImages(f.db, org, project, offers())).rejects.toThrow(/no longer available/);
    f.fake.rows("project_assets")[1].organization_id = org;
    f.fake.rows("project_assets")[1].content_type = "application/pdf";
    await expect(assertOfferingImages(f.db, org, project, offers())).rejects.toThrow(/no longer available/);
  });
  it("reuses two Files IDs without duplicating uploads, and imports only once", async () => {
    const f = fixture();
    await ensureOnboardingCatalog(f.db, website, org);
    expect(f.fake.rows("project_assets")).toHaveLength(2);
    expect(f.fake.rows("website_content_media").map(m => m.id)).toEqual([a, b]);
    const c = f.fake.rows("website_content_collections")[0];
    expect(c).toMatchObject({ module: "products", label: "Products", config: { deliveryPending: true } });
    expect(c.draft).toEqual(offeringRecords(project, offers()));
    c.draft = [{ customer: "later edit" }];
    await ensureOnboardingCatalog(f.db, website, org);
    expect(f.fake.rows("website_content_collections")).toHaveLength(1);
    expect(c.draft).toEqual([{ customer: "later edit" }]);
  });
  it("does not import another tenant or an unfinished brief", async () => {
    const f = fixture();
    await ensureOnboardingCatalog(f.db, website, "other-org");
    f.fake.rows("projects")[0].intake_completed_at = null;
    await ensureOnboardingCatalog(f.db, website, org);
    expect(f.info).not.toHaveBeenCalled();
    expect(f.fake.rows("website_content_collections")).toHaveLength(0);
  });
  it("fills an untouched Express template binding without creating a duplicate collection", async () => {
    const f = fixture(), records = offeringRecords(project, offers());
    f.fake.rows("website_content_collections").push({ id: a, website_id: website, organization_id: org, module: "products", label: "Products", key: "home-products", page_id: "home", section_id: "products", field: "products", adapter: "professional", updated_by: null, published_revision: null, revision: 1, draft: records, config: { awaitingIntake: true, templates: { [records[0].id]: { name: "Serum" } }, sourceIds: { [records[0].id]: "serum" }, maxMedia: 1 } });
    await ensureOnboardingCatalog(f.db, website, org);
    expect(f.fake.rows("website_content_collections")).toHaveLength(1);
    expect(f.fake.rows("website_content_collections")[0]).toMatchObject({ id: a, adapter: "professional", revision: 2, draft: records, config: { awaitingIntake: false, catalogSource: project, deliveryPending: false } });
  });
  it("refuses missing, cross-website or incomplete private media", async () => {
    const f = fixture();
    f.info.mockResolvedValue({ data: { size: 1, contentType: "image/png" }, error: null });
    await expect(ensureOnboardingCatalog(f.db, website, org)).rejects.toThrow(/not finished/);
    expect(f.fake.rows("website_content_collections")).toHaveLength(0);
  });
  it("connects to the real section while preserving IDs and every image as unpublished drafts", () => {
    const records = offeringRecords(project, offers());
    const pending: BoundCollection = { id: a, binding: { version: 1, key: "intake", module: "products", label: "Menu", pageId: "onboarding", sectionId: project, field: "offerings", adapter: "standalone" }, config: { templates: {}, sourceIds: {}, deliveryPending: true, catalogSource: project }, records, revision: 2, publishedRevision: null };
    const delivered: BoundCollection = { ...pending, binding: { ...pending.binding, key: "home-products", pageId: "home", sectionId: "products", field: "products", adapter: "professional" }, config: { templates: { [records[0].id]: { name: "Serum", image: {} } }, sourceIds: { [records[0].id]: "actual-serum" }, maxMedia: 1, editableFields: ["title", "media"] } };
    const connected = connectOnboardingCatalog(pending, delivered);
    expect(connected.binding).toMatchObject({ adapter: "professional", key: "home-products", label: "Menu" });
    expect(connected.config).toMatchObject({ maxMedia: 30, primaryMediaOnly: true, deliveryPending: false });
    expect(connected.records).toEqual(records);
    expect(connected.publishedRevision).toBeNull();
  });
});
