import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const SAFE_CONTROL = path.join(ROOT, "components/vigil/FileUploadButton.tsx");

function tsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(target);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [target] : [];
  });
}

describe("customer upload controls", () => {
  it("routes every native file input through the overflow-safe control", () => {
    const offenders = [path.join(ROOT, "app"), path.join(ROOT, "components")]
      .flatMap(tsxFiles)
      .filter((file) => file !== SAFE_CONTROL)
      .filter((file) => /type=["']file["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));

    expect(offenders).toEqual([]);
  });

  it("keeps the native input clipped to the visible upload boundary", () => {
    const source = readFileSync(SAFE_CONTROL, "utf8");
    expect(source).toContain("relative inline-flex max-w-full");
    expect(source).toContain("overflow-hidden");
    expect(source).toContain('className="absolute inset-0 z-10 h-full w-full');
  });
});
