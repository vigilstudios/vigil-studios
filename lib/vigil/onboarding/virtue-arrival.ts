import type { AnimationControls } from "framer-motion";

const centred = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };

/** Start after Motion subscribes; an interrupted effect must not reveal the speech. */
export function startVirtueArrival(controls: Pick<AnimationControls, "set" | "start" | "stop">, offset: { x: number; y: number }, reducedMotion: boolean, onArrived: () => void): () => void {
  let cancelled = false;
  const frame = window.requestAnimationFrame(() => {
    if (reducedMotion) {
      controls.set(centred);
      onArrived();
      return;
    }
    controls.set({ x: offset.x, y: offset.y, scale: 0.28, rotate: -10, opacity: 1 });
    void controls.start({
      x: [offset.x, offset.x * 0.46, 0],
      y: [offset.y, offset.y * 0.72, 0],
      scale: [0.28, 0.58, 1],
      rotate: [-10, 3, 0],
      opacity: 1,
      transition: { duration: 1.05, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] },
    }).then(() => {
      if (cancelled) return;
      // Do not leave a partially applied transform behind when speech becomes visible.
      controls.set(centred);
      onArrived();
    });
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
    controls.stop();
  };
}
