/**
 * The hero is sticky: the rest of the page scrolls over it. Once the
 * visitor has scrolled a full hero height it is completely covered, so its
 * canvas and notifications can stop. Reports every change of that state.
 */
export function watchCovered(el: HTMLElement, onChange: (covered: boolean) => void) {
  const root = el.closest("#site-root") as HTMLElement | null;
  const hero = el.closest("section") as HTMLElement | null;
  const target: HTMLElement | Window = root ?? window;
  let last: boolean | null = null;
  const check = () => {
    const top = root ? root.scrollTop : window.scrollY;
    const height = hero ? hero.clientHeight : window.innerHeight;
    const covered = top >= height - 1;
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
