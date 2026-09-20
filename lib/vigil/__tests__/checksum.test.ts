import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Sha256, isSha256Hex, sha256Blob, sha256Hex } from "../checksum";

const nodeHash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

describe("streaming SHA-256", () => {
  it("matches node:crypto on known vectors and awkward lengths", () => {
    expect(sha256Hex(new Uint8Array(0))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    for (const length of [1, 55, 56, 57, 63, 64, 65, 119, 120, 128, 1000, 65_537]) {
      const bytes = randomBytes(length);
      expect(sha256Hex(bytes), `length ${length}`).toBe(nodeHash(bytes));
    }
  });

  it("gives the same digest however the input is sliced", () => {
    const bytes = randomBytes(300_000);
    const expected = nodeHash(bytes);
    for (const chunk of [1, 7, 63, 64, 65, 4096, 100_003]) {
      const hash = new Sha256();
      for (let offset = 0; offset < bytes.length; offset += chunk) hash.update(bytes.subarray(offset, offset + chunk));
      expect(hash.digestHex(), `chunk ${chunk}`).toBe(expected);
    }
  });

  it("hashes a Blob slice by slice", async () => {
    const bytes = randomBytes(1_000_000);
    expect(await sha256Blob(new Blob([bytes]), 64 * 1024)).toBe(nodeHash(bytes));
    expect(isSha256Hex(nodeHash(bytes))).toBe(true);
    expect(isSha256Hex("ABC")).toBe(false);
  });
});
