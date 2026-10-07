import { ActionBoundary } from "./ActionBoundary";
import { CompositionPreview } from "../composition/render";
import type { FontBindings } from "../foundations/typography/types";
import type { SiteDefinition } from "./model";
import { resolvePageComposition } from "./navigation";
/** Portable host boundary: the host mounts this against its own router and font/assets. */
export function SitePagePreview({ site, pageId, fonts, embedded = true }: { site: SiteDefinition; pageId: string; fonts?: FontBindings; embedded?: boolean }) {
  const composition = resolvePageComposition(site, pageId);
  return <ActionBoundary site={site} composition={composition}><CompositionPreview composition={composition} fonts={fonts} embedded={embedded}/></ActionBoundary>;
}
