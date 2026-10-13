"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type Runtime = typeof import("./MotionRuntime");
let runtime: Runtime | null = null;
let pending: Promise<Runtime> | null = null;
const listeners = new Set<() => void>();
const read = () => runtime;
const server = () => null;
const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

export function loadMotionRuntime() {
  if (!pending)
    pending = import("./MotionRuntime")
      .then((loaded) => {
        runtime = loaded;
        listeners.forEach((notify) => notify());
        return loaded;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  return pending;
}

export function useMotionRuntime() {
  return useSyncExternalStore(subscribe, read, server);
}

/** A keyboard focus jump can bring a shell into view before its runtime mounts.
 * Keep the focused descendant when React replaces that shell with Motion. */
export function useMotionHost() {
  const element = useRef<HTMLElement | null>(null);
  const focus = useRef<{
    path: number[];
    tag: string;
    href: string | null;
  } | null>(null);
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) {
      const active = document.activeElement;
      const host = element.current;
      if (active instanceof HTMLElement && host?.contains(active)) {
        const path: number[] = [];
        let child: Element = active;
        while (child !== host && child.parentElement) {
          path.unshift(Array.from(child.parentElement.children).indexOf(child));
          child = child.parentElement;
        }
        focus.current = {
          path,
          tag: active.tagName,
          href: active.getAttribute("href"),
        };
      }
    }
    element.current = node;
    if (node && focus.current) {
      const saved = focus.current;
      focus.current = null;
      let target: Element | undefined = node;
      for (const index of saved.path) target = target?.children[index];
      if (
        target instanceof HTMLElement &&
        target.tagName === saved.tag &&
        target.getAttribute("href") === saved.href
      ) {
        target.focus({ preventScroll: true });
      }
    }
  }, []);
  return { ref, element };
}

/** A layout-identical static shell remains until the existing Motion components
 * are loaded. Preload before intersection so all viewport animations still start
 * at their original thresholds. */
export function useViewportMotion() {
  const { ref, element } = useMotionHost();
  const loaded = useMotionRuntime();
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = element.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          void loadMotionRuntime().catch(() => setNear(false));
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, element]);
  return { ref, loaded: near ? loaded : null };
}

/** Navigation stays interactive during startup. Prime its transition code on
 * the first pointer, touch or keyboard input, before a menu needs to animate. */
export function useMotionIntent() {
  const loaded = useMotionRuntime();
  useEffect(() => {
    if (loaded) return;
    const controller = new AbortController();
    const prime = () => {
      controller.abort();
      void loadMotionRuntime().catch(() => {});
    };
    for (const event of [
      "pointermove",
      "pointerdown",
      "touchstart",
      "keydown",
    ]) {
      window.addEventListener(event, prime, {
        passive: true,
        signal: controller.signal,
      });
    }
    return () => controller.abort();
  }, [loaded]);
  return loaded;
}
