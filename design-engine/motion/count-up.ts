export const countUpDefaults = { effect: "count-up", duration: 1400, delay: 0, stagger: 100, easing: "ease-out", replay: false } as const;
export type CountUpSettings = { effect?: "none" | "count-up"; duration?: number; delay?: number; stagger?: number; easing?: "linear" | "ease-out"; replay?: boolean };

/** A single numeric metric; keep ranges, prose and ambiguous separators untouched. */
export function parseCountUpValue(value: string) {
  const match = value.match(/^(\s*(?:[$€£¥~≈<>≤≥]\s*)?[+-]?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\s*[kKmMbBtT]?\s*(?:[%+]\s*)?)$/);
  if (!match) return;
  const decimals = match[3]?.length ? match[3].length - 1 : 0;
  const number = Number((match[2] + (match[3] ?? "")).replaceAll(",", ""));
  if (!Number.isFinite(number) || number > Number.MAX_SAFE_INTEGER || decimals > 20) return;
  const format = new Intl.NumberFormat("en-US", { useGrouping: match[2].includes(","), minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return { number, at: (progress: number) => progress >= 1 ? value : `${match[1]}${format.format(number * Math.max(0, progress))}${match[4]}` };
}

/** Own only the decorative text; the accessible metric always contains its final value. */
export function observeCountUp(target: HTMLElement, value: string, settings: CountUpSettings, disabled = false) {
  target.textContent = value;
  const metric = parseCountUpValue(value);
  if (disabled || settings.effect === "none" || !metric || typeof IntersectionObserver === "undefined" || typeof requestAnimationFrame === "undefined") return;
  const focusRoot = target.closest("section") ?? target;
  if (focusRoot.contains(document.activeElement)) return;
  const duration = settings.duration ?? countUpDefaults.duration;
  let frame = 0, started = false, active = false, disposed = false;
  const finish = () => { cancelAnimationFrame(frame); frame = 0; target.textContent = value; };
  function play() {
    if (focusRoot.contains(document.activeElement)) return;
    started = true;
    const start = performance.now() + (settings.delay ?? countUpDefaults.delay);
    target.textContent = metric!.at(0);
    const tick = (time: number) => {
      if (disposed) return;
      const progress = Math.min(1, Math.max(0, (time - start) / duration));
      const eased = settings.easing === "linear" ? progress : 1 - (1 - progress) ** 3;
      target.textContent = metric!.at(eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
  }
  target.textContent = metric.at(0);
  const observer = new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting && target.checkVisibility?.() !== false;
    if (visible && !active && (!started || settings.replay)) play();
    else if (!visible && active) finish();
    active = visible;
  }, { threshold: .15 });
  observer.observe(target);
  focusRoot.addEventListener("focusin", finish);
  return () => { disposed = true; finish(); observer.disconnect(); focusRoot.removeEventListener("focusin", finish); };
}
