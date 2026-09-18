/**
 * Reports whether the section an element lives in is entirely off screen
 * (scrolled past above, or not yet reached below) so its canvas and
 * notifications can stop. A sticky section that is only partly covered by
 * what scrolls over it still counts as visible.
 */
export function watchCovered(el: HTMLElement, onChange: (covered: boolean) => void) {
  const root = el.closest("#site-root") as HTMLElement | null;
  const section = el.closest("section") as HTMLElement | null;
  const target: HTMLElement | Window = root ?? window;
  let last: boolean | null = null;
  const check = () => {
    const r = (section ?? el).getBoundingClientRect();
    const covered = r.bottom <= 1 || r.top >= window.innerHeight - 1;
    if (covered !== last) {
      last = covered;
      onChange(covered);
    }
  };
  target.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  check();
  return () => {
    target.removeEventListener("scroll", check);
    window.removeEventListener("resize", check);
  };
}
