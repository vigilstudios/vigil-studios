import { clsx, type ClassValue } from "clsx";
/** Engine components use scoped CSS; ordered class composition is shared with UI adapters. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
