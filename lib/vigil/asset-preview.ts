/** Parsing an expiry here only controls preview reuse; it never authorizes access. */
function signedObject(url: string): { identity: string; issuedAt: number; expiresAt: number } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/storage/v1/object/sign/")) return null;
    const token = parsed.searchParams.get("token");
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) return null;
    if (typeof claims.iat !== "number" || !Number.isFinite(claims.iat)) return null;
    // Include transformations and other options in the identity, but not the token.
    parsed.searchParams.delete("token");
    parsed.searchParams.sort();
    return { identity: parsed.toString(), issuedAt: claims.iat * 1000, expiresAt: claims.exp * 1000 };
  } catch {
    return null;
  }
}

/** Keep the loaded preview when a server refresh signs the same object again. */
export function retainAssetPreview(current: string, incoming: string, now?: number): string {
  if (current === incoming) return current;
  const previous = signedObject(current);
  const next = signedObject(incoming);
  // The newly issued token supplies server time, without reading a clock in render.
  return previous && next && previous.identity === next.identity && previous.expiresAt > (now ?? next.issuedAt) + 60_000
    ? current
    : incoming;
}
