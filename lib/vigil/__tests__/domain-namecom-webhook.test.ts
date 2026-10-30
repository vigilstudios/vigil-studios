import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyNamecomWebhook } from "../domain-engine/namecom-webhook";
const token = "fictional-webhook-key",
  url = "https://test.example.com/api/webhooks/namecom?scope=sandbox";
const now = new Date("2026-10-26T12:00:00Z"),
  timestamp = Math.floor(now.getTime() / 1000);
const nonce = "10000000-0000-4000-8000-000000000001";
const canonical =
  '{"action":"updated","domains":["fixture.com"],"metadata":{"10":"ten","2":"two","a":1,"z":"café"}}';
const signature = createHmac("sha256", token)
  .update(`${url}|${canonical}`)
  .digest("hex");
const header = `sha256=${signature},${timestamp},${nonce}`;
const raw =
  '{"metadata":{"z":"café","2":"two","a":1,"10":"ten"},"domains":["fixture.com"],"action":"updated"}';
describe("Name.com signed notifications", () => {
  it("verifies the configured full URL and recursively sorted compact JSON including numeric keys", () => {
    expect(
      verifyNamecomWebhook(raw, header, token, url, now).payloadDigest,
    ).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyNamecomWebhook(canonical, header, token, url, now)).toEqual(
      verifyNamecomWebhook(raw, header, token, url, now),
    );
  });
  it.each([
    "wrong key",
    "wrong URL",
    "tampered body",
    "sha1",
    "missing signature",
  ])("refuses %s", (kind) => {
    expect(() =>
      verifyNamecomWebhook(
        kind === "tampered body" ? raw.replace("updated", "deleted") : raw,
        kind === "sha1"
          ? header.replace("sha256", "sha1")
          : kind === "missing signature"
            ? null
            : header,
        kind === "wrong key" ? "wrong" : token,
        kind === "wrong URL" ? url.split("?")[0] : url,
        now,
      ),
    ).toThrow("could not be verified");
  });
  it("deduplicates signed content even when an attacker changes the unsigned timestamp or nonce", () => {
    const altered = `sha256=${signature},${timestamp + 1},20000000-0000-4000-8000-000000000002`;
    expect(
      verifyNamecomWebhook(raw, altered, token, url, now).payloadDigest,
    ).toBe(verifyNamecomWebhook(raw, header, token, url, now).payloadDigest);
  });
  it("bounds time, size, JSON depth, payload shape and numeric precision", () => {
    for (const h of [
      header.replace(String(timestamp), String(timestamp - 301)),
      header.replace(String(timestamp), String(timestamp + 301)),
      header.replace(nonce, "not-a-nonce"),
    ])
      expect(() => verifyNamecomWebhook(raw, h, token, url, now)).toThrow();
    for (const body of [
      "[1]",
      "null",
      "bad",
      " ".repeat(65537),
      JSON.stringify({ value: "x".repeat(65537) }),
      '{"value":1e999}',
      '{"value":9007199254740993}',
    ])
      expect(() =>
        verifyNamecomWebhook(body, header, token, url, now),
      ).toThrow();
    let nested: unknown = "x";
    for (let i = 0; i < 35; i++) nested = { nested };
    expect(() =>
      verifyNamecomWebhook(JSON.stringify(nested), header, token, url, now),
    ).toThrow();
  });
});
