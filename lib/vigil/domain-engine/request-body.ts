import { DomainEngineError } from "./errors";
/** Bound memory before parsing authenticated requests or unauthenticated webhooks. */
export async function boundedDomainBody(request: Request, maxBytes: number) {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes)
    throw new DomainEngineError(
      "request_too_large",
      "The request is too large.",
      413,
    );
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new DomainEngineError(
        "request_too_large",
        "The request is too large.",
        413,
      );
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
