import { effectiveSections, type SiteDefinition } from "./model";
import { deserializeSite, serializeSite } from "./persistence";

export const siteHistoryLimit = 50;
export const siteHistoryKey = "vigil-design-engine:site-history:v1";
export const historyTypingWindow = 750;
export type HistoryLocation = { pageId: string; sectionId: string };
export type SiteHistoryEntry = HistoryLocation & { document: string };
export type SiteHistory = {
  past: SiteHistoryEntry[]; present: SiteHistoryEntry; future: SiteHistoryEntry[];
  typing?: { key: string; at: number };
};

function entry(site: SiteDefinition, location?: HistoryLocation): SiteHistoryEntry {
  const page = site.pages.find(page => page.id === location?.pageId) ?? site.pages.find(page => page.id === site.navigation.homePageId)!;
  const sections = effectiveSections(site, page);
  return {
    document: serializeSite(site), pageId: page.id,
    sectionId: sections.some(section => section.id === location?.sectionId) ? location!.sectionId : sections[0]?.id ?? "",
  };
}
export function createSiteHistory(site: SiteDefinition, location?: HistoryLocation): SiteHistory {
  return { past: [], present: entry(site, location), future: [] };
}
/** Immutable serialized snapshots protect recovery from later object mutations. */
export function recordSiteChange(history: SiteHistory, site: SiteDefinition, location: HistoryLocation, typing?: { key: string; at: number }): SiteHistory {
  const present = entry(site, location);
  if (present.document === history.present.document) return history;
  const coalesce = typing && history.typing?.key === typing.key && typing.at >= history.typing.at && typing.at - history.typing.at <= historyTypingWindow && history.future.length === 0;
  const before = entry(deserializeSite(history.present.document), location);
  return {
    past: coalesce ? history.past : [...history.past, before].slice(-siteHistoryLimit),
    present, future: [], typing,
  };
}
export function undoSiteChange(history: SiteHistory): SiteHistory {
  const present = history.past.at(-1);
  return present ? { past: history.past.slice(0, -1), present, future: [history.present, ...history.future] } : history;
}
export function redoSiteChange(history: SiteHistory): SiteHistory {
  const present = history.future[0];
  return present ? { past: [...history.past, history.present].slice(-siteHistoryLimit), present, future: history.future.slice(1) } : history;
}
export function locateSiteHistory(history: SiteHistory, location: HistoryLocation): SiteHistory {
  const present = entry(deserializeSite(history.present.document), location);
  return present.pageId === history.present.pageId && present.sectionId === history.present.sectionId ? history : { ...history, present, typing: undefined };
}
export function serializeSiteHistory(history: SiteHistory): string {
  return JSON.stringify({ version: 1, past: history.past, present: history.present, future: history.future });
}
/** Stale or damaged history must never replace the independently saved working draft. */
export function restoreSiteHistory(json: string | null, site: SiteDefinition): SiteHistory {
  const baseline = createSiteHistory(site);
  if (!json) return baseline;
  try {
    const value = JSON.parse(json);
    if (value.version !== 1 || !Array.isArray(value.past) || !Array.isArray(value.future) || value.past.length + value.future.length > siteHistoryLimit) return baseline;
    const read = (snapshot: unknown) => {
      if (!snapshot || typeof snapshot !== "object" || !("document" in snapshot) || typeof snapshot.document !== "string") throw new Error("Invalid history snapshot.");
      const location = snapshot as SiteHistoryEntry;
      return entry(deserializeSite(location.document), location);
    };
    const present = read(value.present);
    if (present.document !== baseline.present.document) return baseline;
    return { past: value.past.map(read), present, future: value.future.map(read) };
  } catch { return baseline; }
}
