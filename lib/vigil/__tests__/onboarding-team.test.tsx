import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { brandSchema, parseBrief } from "../onboarding/brief";
import { ensureOnboardingCatalog, teamRecords } from "../content/onboarding-catalog";
import { teamReadiness } from "../content/team-readiness";
import { discoverBindings, applyBindings, recordsFromLab } from "../content/professional";
import { payloadSchemas, publicationIssues } from "../content/contract";
import { FakeAdmin } from "./fake-admin";
import { makeTeamSection } from "@/design-engine/preview/team-fixture";
import { siteFromComposition } from "@/design-engine/site/model";
import { collectionCapabilities } from "@/design-engine/content/settings";
import { sectionSchemas } from "@/design-engine/composition/schemas";
import { Team } from "@/design-engine/sections/creators/Team";
const member = "ae000000-0000-4000-8000-000000000001", image = "ae000000-0000-4000-8000-000000000002";
const team = () => brandSchema.parse({ team: { enabled: true, members: [{ id: member, name: "Taylor", role: "Designer", bio: "Thoughtful work." }] } }).team;
const document = () => siteFromComposition({ id: "team-site", label: "Team website", site: { brand: { theme: "neutral" }, typography: "humanist", artDirection: "gallery", motion: "none", icons: { id: "core", strokeWidth: 1.5 } }, sections: [makeTeamSection("team")] });
describe("optional onboarding team", () => {
  it("keeps existing briefs opted out and emits no team records without explicit use", () => {
    expect(brandSchema.parse({}).team).toEqual({ enabled: false, members: [] });
    expect(teamRecords("project", { ...team(), enabled: false })).toEqual([]);
    expect(teamRecords("project", { enabled: true, members: [] })).toEqual([]);
  });
  it("keeps stable employee IDs and an optional private portrait across renames", () => {
    const value = team(); value.members[0].imageAssetIds = [image];
    const first = teamRecords("project", value)[0]; value.members[0].name = "Taylor Morgan";
    const next = teamRecords("project", value)[0];
    expect(next.id).toBe(first.id);
    expect(next.data).toMatchObject({ title: "Taylor Morgan", role: "Designer", description: "Thoughtful work.", media: [{ id: image, type: "image", src: "" }] });
  });
  it("rejects multiple portraits and videos in canonical team entries", () => {
    expect(payloadSchemas.team.safeParse({ title: "Taylor", media: [{ type: "video", src: "https://example.test/clip.mp4", alt: "Clip" }] }).success).toBe(false);
    expect(brandSchema.safeParse({ team: { enabled: true, members: [{ id: member, name: "Taylor", imageAssetIds: [image, member] }] } }).success).toBe(false);
    expect(publicationIssues("team", [{ id: member, slug: "taylor", deleted: false, featured: false, data: payloadSchemas.team.parse({ title: "" }) }])).toContain("Add a title to every entry.");
  });
  it("creates only a used Team tab and preserves later Content Hub edits on replay", async () => {
    const db = new FakeAdmin({ websites: [{ id: "site", organization_id: "org", project_id: "project" }], projects: [{ id: "project", organization_id: "org", intake_completed_at: "2026-10-27", brief: { brand: { team: { ...team(), enabled: false } } } }] });
    await ensureOnboardingCatalog(db.asClient(), "site", "org"); expect(db.rows("website_content_collections")).toHaveLength(0);
    db.rows("projects")[0].brief = { brand: { team: team() } };
    await ensureOnboardingCatalog(db.asClient(), "site", "org");
    const collection = db.rows("website_content_collections")[0];
    expect(collection).toMatchObject({ module: "team", label: "The team", config: { deliveryPending: true, maxMedia: 1 } });
    collection.draft = [{ later: "customer edit" }]; await ensureOnboardingCatalog(db.asClient(), "site", "org");
    expect(collection.draft).toEqual([{ later: "customer edit" }]);
    expect(db.rows("website_content_collections")).toHaveLength(1);
  });
  it("discovers a real Lab team collection and round-trips names, roles and biographies", () => {
    const site = document(), [collection] = discoverBindings(site, member);
    expect(collection.binding.module).toBe("team");
    expect(collectionCapabilities("about.team", sectionSchemas["about.team"])[0]).toMatchObject({ field: "members", module: "team", minimum: 0, maximum: 50, hasMedia: true });
    collection.records[0].data = payloadSchemas.team.parse({ title: "Taylor", role: "Designer", description: "A customer-owned biography" });
    const edited = applyBindings(site, [collection]);
    expect(JSON.stringify(edited)).toContain("A customer-owned biography");
    expect(recordsFromLab(edited, collection)[0].data).toMatchObject({ title: "Taylor", role: "Designer", description: "A customer-owned biography" });
  });
  it("renders semantic cards and a list with initials instead of invented portraits", () => {
    const section = makeTeamSection("team");
    expect(section.component).toBe("about.team"); if (section.component !== "about.team") throw new Error("fixture");
    for (const structure of ["cards", "list"] as const) {
      const html = renderToStaticMarkup(<Team {...section} structure={structure} />);
      expect(html).toContain(`data-layout="${structure}"`); expect(html).toContain("<h2"); expect(html).toContain("Alex Morgan"); expect(html).not.toContain("<img");
    }
    expect(renderToStaticMarkup(<Team {...section} content={{ ...section.content, members: [] }} />)).toBe("");
  });
  it("flags missing Express components and clears only for a real export with a binding", async () => {
    const brief = parseBrief({ brand: { team: team() } }), project = { id: "project", kind: "express", brief };
    const db = new FakeAdmin({});
    expect(await teamReadiness(db.asClient(), "org", project, { id: "site" })).toMatchObject({ ready: false, count: 1, message: expect.stringContaining("Implement the section") });
    db.rows("website_content_runtimes").push({ website_id: "site", organization_id: "other-org", site_definition: document() });
    expect((await teamReadiness(db.asClient(), "org", project, { id: "site" }))?.ready).toBe(false);
    db.rows("website_content_runtimes")[0].organization_id = "org";
    db.rows("website_content_collections").push({ website_id: "site", organization_id: "org", module: "team", enabled: true, adapter: "professional", config: { deliveryPending: false } });
    expect((await teamReadiness(db.asClient(), "org", project, { id: "site" }))?.ready).toBe(true);
  });
});
