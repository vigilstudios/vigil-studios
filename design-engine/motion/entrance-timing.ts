// Coordinate decorative counters with the entrance of their containing motion piece.
// Weak keys keep this transient timing out of saved content and release removed DOM.
const entrances = new WeakMap<HTMLElement, number>();
export function setEntranceReadyAt(target: HTMLElement, time: number) { entrances.set(target, time); }
export function clearEntranceTiming(target: HTMLElement) { entrances.delete(target); }
export function entranceReadyAt(target: HTMLElement) {
  let ready = 0;
  for (let node: HTMLElement | null = target; node; node = node.parentElement) ready = Math.max(ready, entrances.get(node) ?? 0);
  return ready;
}
