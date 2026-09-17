/**
 * One smoothed pointer position, −1…1 from the viewport centre, shared by
 * the hero's mark and its notifications so they lean the same way. Pointer
 * devices only; on touch it stays at the centre and nothing leans.
 */
export const cursor = { x: 0, y: 0, tx: 0, ty: 0 };

let started = false;
let lastTick = -1;

export function startCursor() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  window.addEventListener(
    "pointermove",
    (e) => {
      cursor.tx = (e.clientX / window.innerWidth) * 2 - 1;
      cursor.ty = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );
}

/** Ease toward the pointer once per animation frame, whichever loop asks first. */
export function tickCursor(now: number) {
  if (now === lastTick) return;
  lastTick = now;
  cursor.x += (cursor.tx - cursor.x) * 0.06;
  cursor.y += (cursor.ty - cursor.y) * 0.06;
}
