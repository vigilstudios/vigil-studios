/** Stable, serializable names shared by metadata and icon implementation. */
export const coreIconNames = [
  "arrow-left", "arrow-right", "arrow-up-right", "calendar", "check",
  "chevron-down", "close", "download", "external-link", "help", "mail",
  "map", "menu", "minus", "phone", "play", "plus", "search", "upload", "user",
] as const;
export type VigilIconName = (typeof coreIconNames)[number];
