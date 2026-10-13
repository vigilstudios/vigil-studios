"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore, type ReactNode } from "react";
import { getStoryProgress, subscribeStory } from "./progress";

const Scene = dynamic(() => import("./HowItWorksScene").then((mod) => mod.HowItWorksScene), { ssr: false });
const subscribe = (notify: () => void) => subscribeStory(notify);
// The header begins at .3. Start loading at the first small movement, with
// almost three viewports of lead time; a direct anchor jump initializes too.
const approaching = () => getStoryProgress() > 0.01;

export function StoryScene({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(subscribe, approaching, () => false);
  return active ? <Scene /> : children;
}
