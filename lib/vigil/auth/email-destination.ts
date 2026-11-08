import "server-only";
import { safeNextPath } from "./redirects";
/** Carry the destination in the email, so another browser can resume the same package. */
export function emailConfirmationTarget(origin: string, next: string) {
  return `${origin}/auth/confirm/${Buffer.from(safeNextPath(next), "utf8").toString("base64url")}`;
}
export function decodeEmailDestination(value: string) {
  if (!/^[A-Za-z0-9_-]{1,4096}$/.test(value)) return "/dashboard";
  const decoded = Buffer.from(value, "base64url").toString("utf8");
  if (Buffer.from(decoded, "utf8").toString("base64url") !== value)
    return "/dashboard";
  return safeNextPath(decoded);
}
