"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Layout dimensions, unaffected by transforms. A primitive snapshot stays stable
 * between ResizeObserver notifications, including while CSS animates an iframe. */
export function useElementBox(
  element: HTMLElement | null,
  axes: "width" | "both" = "both",
) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!element) return () => {};
      const observer = new ResizeObserver(onChange);
      observer.observe(element);
      return () => observer.disconnect();
    },
    [element],
  );
  const snapshot = useCallback(
    () =>
      element
        ? `${element.clientWidth}:${axes === "both" ? element.clientHeight : 0}`
        : "0:0",
    [element, axes],
  );
  const value = useSyncExternalStore(subscribe, snapshot, () => "0:0");
  const [width, height] = value.split(":").map(Number);
  return { width, height };
}
