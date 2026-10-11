"use client";
import { containsVideoAsset } from "../media/source";
import type { ReactNode } from "react";
import { DesignButton } from "../primitives/DesignButton";
import { useActionResolution, useSectionActions } from "./ActionContext";
import type { ActionPresentation, ActionSlot } from "./schema";
export type LegacyDestination = { label: string; href: string };

function SlotLink({ slot, fallback, presentation, className = "", children, onClick }: { slot?: ActionSlot; fallback?: LegacyDestination; presentation?: ActionPresentation; className?: string; children?: ReactNode; onClick?: () => void }) {
  const resolved = useActionResolution(slot);
  if (slot && !slot.enabled || !slot && !fallback) return null;
  const label = resolved?.label ?? fallback?.label;
  return <DesignButton href={resolved?.href ?? (slot ? undefined : fallback?.href)} disabled={!!resolved?.issue} unavailable={resolved?.issue} download={resolved && "download" in resolved ? resolved.download : undefined} presentation={resolved?.presentation} authoredPresentation={presentation} className={className} onClick={onClick}>{children ?? label}</DesignButton>;
}
export function SectionActions({ primary, secondary, className = "" }: { primary?: LegacyDestination; secondary?: LegacyDestination; className?: string }) {
  const { section, capability } = useSectionActions();
  const first = section?.contextualActions?.primary, second = section?.contextualActions?.secondary;
  if ((!first || !first.enabled) && !(!first && primary) && (!second || !second.enabled) && !(!second && secondary)) return null;
  const alignment = first?.enabled ? first.presentation?.alignment : second?.enabled ? second.presentation?.alignment : undefined;
  const editorial = capability?.primary?.variant?.[0] === "text";
  return <div className={`de-action-group ${className}`} data-action-align={alignment} data-de-motion-piece="content">
    <SlotLink slot={first} fallback={primary} presentation={{ variant: editorial ? "underline" : undefined }}/>
    <SlotLink slot={second} fallback={secondary} presentation={{ variant: "text" }}/>
  </div>;
}
export function PrimaryAction({ fallback, className, onClick }: { fallback?: LegacyDestination; className?: string; onClick?: () => void }) {
  const { section } = useSectionActions();
  return <SlotLink slot={section?.contextualActions?.primary} fallback={fallback} className={className} presentation={{ variant: "text", size: "small" }} onClick={onClick}/>;
}
export function ItemAction({ itemId, group, fallback, className = "", heading = false, children }: { itemId: string; group?: string; fallback?: LegacyDestination; className?: string; heading?: boolean; children?: ReactNode }) {
  const { section } = useSectionActions();
  const configured = section?.contextualActions?.items?.find(item => item.itemId === itemId && (!group || item.group === group));
  if (configured?.display === "media" || configured?.slot.enabled === false) return children ? <span>{children}</span> : null;
  return <SlotLink slot={configured?.slot} fallback={fallback} presentation={{ variant: heading ? "text" : "underline", ...(heading ? {} : {size:"small" as const}), icon: "arrow-up-right" }} className={`${className} ${heading ? "de-action-heading" : ""} ${configured?.display === "whole-item" ? "de-action-stretched" : ""}`} >{configured ? undefined : children}</SlotLink>;
}
/** Media-only interaction is a single named anchor; selection thumbnails and video controls never enter this wrapper. */
export function ActionMedia({ itemId, group, children }: { itemId: string; group: string; children: ReactNode }) {
  const { section } = useSectionActions();
  const configured = section?.contextualActions?.items?.find(item => item.itemId === itemId && item.group === group && item.display === "media");
  const resolved = useActionResolution(configured?.slot);
  if (!resolved) return <>{children}</>;
  if (resolved.issue) return <div className="de-action-media" aria-disabled="true" title={resolved.issue}>{children}<span role="status">Destination unavailable</span></div>;
  const records = section && (section.content as Record<string,unknown>)[group];
  const record = Array.isArray(records) ? records.find(item => item.id === itemId) : undefined;
  if (containsVideoAsset(record)) return <div className="de-action-media" data-video="true">{children}<a data-action-link="true" className="de-action-media-destination" href={resolved.href} download={"download" in resolved ? resolved.download : undefined}>{resolved.label}</a></div>;
  return <a data-action-link="true" className="de-action-media" href={resolved.href} download={"download" in resolved ? resolved.download : undefined} aria-label={resolved.label}>{children}</a>;
}
