/** Initial/edited Hero contrast is immediate; scrolling may still transition colors. */
export function initializeNavigationInk(header: HTMLElement, light?: boolean) {
  const ink = light === undefined ? "" : light ? "var(--de-palette-light)" : "var(--de-palette-dark)";
  if (header.dataset.paletteReady === "true" && header.style.getPropertyValue("--de-navigation-auto-ink") === ink) return;
  header.dataset.paletteReady = "false";
  if (ink) header.style.setProperty("--de-navigation-auto-ink", ink);
  else header.style.removeProperty("--de-navigation-auto-ink");
  // Resolve the final palette with transitions disabled before enabling scroll paint.
  getComputedStyle(header).getPropertyValue("color");
  header.dataset.paletteReady = "true";
}
