import { describe, expect, it } from "vitest";
import seed from "../docs/design-engine/creator-express-editor/muse-bennett.site.json";
import { deserializeSite, serializeSite } from "../design-engine/site/persistence";
import { createSiteHistory, recordSiteChange, undoSiteChange, redoSiteChange, locateSiteHistory, restoreSiteHistory, serializeSiteHistory, siteHistoryLimit } from "../design-engine/site/history";
import { addPage, deletePage, updatePage } from "../design-engine/site/operations";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import { historyShortcut } from "../design-engine/preview/editor/history-input";

const fixture = () => deserializeSite(JSON.stringify(seed));
const location = { pageId: "page-home", sectionId: "navigation" };

describe("Site editor change history", () => {
  it("recovers an entire customized navbar after replacing its structure, and redoes the replacement", () => {
    const before = fixture(), changed = structuredClone(before);
    changed.pages[0].slots.navigation = { mode: "replace", section: makeSection("navigation.datum", "navigation") };
    const initial = createSiteHistory(before, location), edited = recordSiteChange(initial, changed, location);
    expect(deserializeSite(undoSiteChange(edited).present.document)).toEqual(before);
    expect(deserializeSite(redoSiteChange(undoSiteChange(edited)).present.document)).toEqual(changed);
    expect(edited.past[0].sectionId).toBe("navigation");
  });
  it("undoes and redoes content, presentation, media, motion and site defaults together", () => {
    const before = fixture(), changed = structuredClone(before), hero = changed.pages[0].sections[0];
    Object.assign(hero.content, { title: "Revised creator title" });
    hero.presentation = { ...hero.presentation, imageMotion: "animate", motionMode: "override", motion: { entrance: "zoom", duration: 1200 } };
    changed.settings.presentation = { heading: { titleSize: 72 } };
    changed.title = "New working title";
    const edited = recordSiteChange(createSiteHistory(before), changed, { ...location, sectionId: hero.id });
    expect(undoSiteChange(edited).present.document).toBe(serializeSite(before));
    expect(redoSiteChange(undoSiteChange(edited)).present.document).toBe(serializeSite(changed));
  });
  it("retains the most recent 50 changes without losing the current document", () => {
    const base = fixture(); let history = createSiteHistory(base);
    for (let step = 1; step <= 55; step++) history = recordSiteChange(history, { ...base, title: `Change ${step}` }, location);
    expect(history.past).toHaveLength(siteHistoryLimit);
    for (let step = 0; step < 50; step++) history = undoSiteChange(history);
    expect(deserializeSite(history.present.document).title).toBe("Change 5");
    expect(undoSiteChange(history)).toBe(history);
    expect(history.future).toHaveLength(50);
    for (let step = 0; step < 50; step++) history = redoSiteChange(history);
    expect(deserializeSite(history.present.document).title).toBe("Change 55");
    expect(redoSiteChange(history)).toBe(history);
  });
  it("discards redo only when an actual new edit branches from an undone document", () => {
    const site = fixture(); const edited = recordSiteChange(createSiteHistory(site), { ...site, title: "First edit" }, location);
    const undone = undoSiteChange(edited);
    expect(recordSiteChange(undone, site, location)).toBe(undone);
    const branched = recordSiteChange(undone, { ...site, title: "Different edit" }, location);
    expect(branched.future).toEqual([]);
    expect(undoSiteChange(branched).present.document).toBe(serializeSite(site));
  });
  it("groups a quick typing burst into one undo, but separates fields, pauses and discrete actions", () => {
    const site = fixture(); let history = createSiteHistory(site);
    history = recordSiteChange(history, { ...site, title: "M" }, location, { key: "title", at: 100 });
    history = recordSiteChange(history, { ...site, title: "Muse" }, location, { key: "title", at: 200 });
    expect(history.past).toHaveLength(1);
    expect(undoSiteChange(history).present.document).toBe(serializeSite(site));
    history = recordSiteChange(history, { ...site, title: "Muse updated" }, location, { key: "title", at: 1000 });
    history = recordSiteChange(history, { ...site, title: "Other field" }, location, { key: "description", at: 1100 });
    history = recordSiteChange(history, { ...site, title: "Select action" }, location);
    expect(history.past).toHaveLength(4);
  });
  it("never groups typing across an undo/redo boundary or a clock reversal", () => {
    const site = fixture(); let history = recordSiteChange(createSiteHistory(site), { ...site, title: "First" }, location, { key: "title", at: 100 });
    history = recordSiteChange(redoSiteChange(undoSiteChange(history)), { ...site, title: "Second" }, location, { key: "title", at: 200 });
    expect(history.past).toHaveLength(2);
    history = recordSiteChange(history, { ...site, title: "Third" }, location, { key: "title", at: 50 });
    expect(history.past).toHaveLength(3);
  });
  it("keeps snapshots independent of later mutations", () => {
    const site = fixture(), history = createSiteHistory(site);
    site.title = "Mutated source";
    const changed = { ...site, title: "Next" }, edited = recordSiteChange(history, changed, location);
    changed.title = "Mutated next";
    expect(deserializeSite(history.present.document).title).toBe(seed.title);
    expect(deserializeSite(edited.present.document).title).toBe("Next");
  });
  it("restores deleted pages and their section context without recording page selection as an edit", () => {
    const added = addPage(fixture(), "Second page"), initial = createSiteHistory(added.site);
    const visited = locateSiteHistory(initial, { pageId: added.pageId, sectionId: "" });
    expect(visited.past).toEqual([]);
    const deleted = recordSiteChange(visited, deletePage(added.site, added.pageId, "reparent"), { pageId: added.pageId, sectionId: "" });
    expect(deleted.present.pageId).toBe("page-home");
    const recovered = undoSiteChange(deleted);
    expect(recovered.present.pageId).toBe(added.pageId);
    expect(deserializeSite(recovered.present.document)).toEqual(added.site);
  });
  it("retains redo while browsing pages and falls back safely for unavailable selections", () => {
    const site = fixture(); let history = undoSiteChange(recordSiteChange(createSiteHistory(site), { ...site, title: "Next" }, location));
    history = locateSiteHistory(history, { pageId: "missing-page", sectionId: "missing-section" });
    expect(history.future).toHaveLength(1);
    expect(history.present.pageId).toBe(site.navigation.homePageId);
    expect(history.present.sectionId).toBe("navigation");
  });
  it("covers page metadata, ordering and document replacement as recoverable edits", () => {
    const site = fixture(), pageChanged = updatePage(site, "page-home", { title: "Edited home" });
    const edited = recordSiteChange(createSiteHistory(site), pageChanged, location);
    const replacement = recordSiteChange(edited, { ...site, id: "replacement-site", title: "Imported site" }, location);
    expect(undoSiteChange(replacement).present.document).toBe(serializeSite(pageChanged));
    expect(undoSiteChange(undoSiteChange(replacement)).present.document).toBe(serializeSite(site));
  });
  it("rejects invalid documents before changing the recovery chain", () => {
    const site = fixture(), history = createSiteHistory(site);
    expect(() => recordSiteChange(history, { ...site, pages: [] }, location)).toThrow();
    expect(history.past).toEqual([]);
    expect(history.present.document).toBe(serializeSite(site));
  });
  it("persists undo and redo across reload without restarting a typing group", () => {
    const site = fixture(), edited = recordSiteChange(createSiteHistory(site), { ...site, title: "Saved change" }, location, { key: "field", at: 1 });
    const persisted = restoreSiteHistory(serializeSiteHistory(edited), deserializeSite(edited.present.document));
    expect(persisted.past).toEqual(edited.past);
    expect(persisted.typing).toBeUndefined();
    const undone = undoSiteChange(persisted), reloaded = restoreSiteHistory(serializeSiteHistory(undone), site);
    expect(redoSiteChange(reloaded).present.document).toBe(edited.present.document);
  });
  it.each([null, "{", '{"version":2}', '{"version":1,"past":[],"future":[],"present":{}}'])("preserves the working draft when history is absent or damaged: %s", json => {
    const site = fixture(), recovered = restoreSiteHistory(json, site);
    expect(recovered.present.document).toBe(serializeSite(site));
    expect(recovered.past).toEqual([]); expect(recovered.future).toEqual([]);
  });
  it("refuses stale, oversized or partially corrupt saved history", () => {
    const site = fixture(), history = recordSiteChange(createSiteHistory(site), { ...site, title: "Old draft" }, location);
    expect(restoreSiteHistory(serializeSiteHistory(history), site).past).toEqual([]);
    const value = JSON.parse(serializeSiteHistory(createSiteHistory(site)));
    value.past = Array(51).fill(value.present);
    expect(restoreSiteHistory(JSON.stringify(value), site).past).toEqual([]);
    value.past = [{ ...value.present, document: "{}" }];
    expect(restoreSiteHistory(JSON.stringify(value), site).past).toEqual([]);
  });
});

describe("Document history keyboard routing", () => {
  const key = (key: string, options: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...options });
  it("supports Mac and Windows undo/redo shortcuts", () => {
    expect(historyShortcut(key("z", { metaKey: true }), false)).toBe("undo");
    expect(historyShortcut(key("Z", { ctrlKey: true }), false)).toBe("undo");
    expect(historyShortcut(key("z", { metaKey: true, shiftKey: true }), false)).toBe("redo");
    expect(historyShortcut(key("z", { ctrlKey: true, shiftKey: true }), false)).toBe("redo");
    expect(historyShortcut(key("y", { ctrlKey: true }), false)).toBe("redo");
  });
  it("preserves native field undo and unrelated browser/OS shortcuts", () => {
    expect(historyShortcut(key("z", { metaKey: true }), true)).toBeUndefined();
    expect(historyShortcut(key("z"), false)).toBeUndefined();
    expect(historyShortcut(key("z", { ctrlKey: true, altKey: true }), false)).toBeUndefined();
    expect(historyShortcut(key("y", { metaKey: true }), false)).toBeUndefined();
    expect(historyShortcut(key("y", { ctrlKey: true, shiftKey: true }), false)).toBeUndefined();
  });
});
