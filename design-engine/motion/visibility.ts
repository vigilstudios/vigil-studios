"use client";
import { useSyncExternalStore } from "react";
function subscribe(notify:()=>void) { document.addEventListener("visibilitychange",notify); return ()=>document.removeEventListener("visibilitychange",notify); }
/** Shared only by Collection 008 continuous/sequenced evidence. */
export function usePageVisible() { return useSyncExternalStore(subscribe,()=>document.visibilityState === "visible",()=>true); }
