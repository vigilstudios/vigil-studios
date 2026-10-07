import type { SiteDefinition, SitePage } from "./model";
/** Relative slugs can contain multiple segments; slash boundaries are never guessed. */
export function normalizeSlug(value: string): string {
  if (value.trim() === "/") return "/";
  const segments = value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split("/").filter(Boolean).map(segment => segment.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  if (!segments.length || segments.some(segment => !segment)) throw new Error("Use at least one non-empty slug segment.");
  return segments.join("/");
}
export function normalizeRoute(value: string): string { const slug = normalizeSlug(value); return slug === "/" ? "/" : `/${slug}`; }
export function resolveRoutes(site: Pick<SiteDefinition, "pages">): Map<string, string> {
  const pages = new Map(site.pages.map(page => [page.id, page]));
  if (pages.size !== site.pages.length) throw new Error("Page IDs must be unique.");
  const routes = new Map<string, string>(), visiting = new Set<string>();
  function visit(page: SitePage): string {
    if (visiting.has(page.id)) throw new Error("Circular page hierarchy is not allowed.");
    if (routes.has(page.id)) return routes.get(page.id)!;
    visiting.add(page.id);
    if (page.parentId === page.id) throw new Error("A page cannot parent itself.");
    const parent = page.parentId ? pages.get(page.parentId) : undefined;
    if (page.parentId && !parent) throw new Error(`Parent of ${page.title} does not exist.`);
    const parentRoute = parent ? visit(parent) : "";
    const slug = normalizeSlug(page.slug);
    if (slug !== page.slug) throw new Error(`Slug for ${page.title} must be normalized: ${slug}`);
    if (slug === "/" && parent) throw new Error("The root page cannot have a parent.");
    const route = page.routeOverride ?? (slug === "/" ? "/" : `${parentRoute === "/" ? "" : parentRoute}/${slug}`);
    if (page.routeOverride && normalizeRoute(page.routeOverride) !== page.routeOverride) throw new Error("Explicit routes must be normalized absolute paths.");
    if (route.length > 2000) throw new Error("Effective routes must be at most 2000 characters.");
    if ([...routes.values()].includes(route)) throw new Error(`Duplicate route: ${route}`);
    visiting.delete(page.id); routes.set(page.id, route); return route;
  }
  site.pages.forEach(visit); return routes;
}
export function siblings(site: Pick<SiteDefinition, "pages">, parentId: string | null): SitePage[] {
  return site.pages.filter(page => page.parentId === parentId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
export function descendantIds(site: Pick<SiteDefinition, "pages">, pageId: string): Set<string> {
  const result = new Set<string>();
  const queue = [pageId];
  for (let index = 0; index < queue.length; index++) for (const child of site.pages.filter(page => page.parentId === queue[index])) {
    if (child.id === pageId) throw new Error("Circular page hierarchy is not allowed.");
    if (!result.has(child.id)) { result.add(child.id); queue.push(child.id); }
  }
  return result;
}
