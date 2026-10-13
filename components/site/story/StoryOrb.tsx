"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import type { AgentState } from "@/components/ui/orb";
import { getStoryProgress, PHASE, subscribeStory } from "./progress";

const Orb = dynamic(() => import("@/components/ui/orb").then((mod) => mod.Orb), { ssr: false });
const subscribe = (notify: () => void) => subscribeStory(notify);
// Start loading during the timeline entrance, before station 2 reaches the screen.
// Unmount after its scene leaves; an opacity-zero WebGL canvas still renders every frame.
const active = () => getStoryProgress() >= PHASE.ravel[0] && getStoryProgress() < 0.85;
const tabVisible = () => !document.hidden;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeReduced = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export function StoryOrb({ agentState }: { agentState: AgentState }) {
  const mounted = useSyncExternalStore(subscribe, active, () => false);
  const visible = useSyncExternalStore(subscribeVisibility, tabVisible, () => true);
  const still = useSyncExternalStore(subscribeReduced, reduced, () => false);
  return mounted ? <Orb agentState={agentState} seed={7} still={still} active={visible} className="absolute inset-0" /> : null;
}
