import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AVAILABLE_EXPRESS_TEMPLATES, EXPRESS_TEMPLATES, isAvailableExpressTemplateSlug } from "@/lib/constants";

const ROOT = path.resolve(__dirname, "../../..");

function tsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(target);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [target] : [];
  });
}

describe("admin template slug fields", () => {
  it("does not expose a free-text template slug field", () => {
    const offenders = tsxFiles(path.join(ROOT, "app/(vigil)/admin"))
      .filter((file) => /<input\b[^>]*\bname=["']template_slug["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));

    expect(offenders).toEqual([]);
  });

  it("recognizes only finished templates as assignable", () => {
    for (const template of AVAILABLE_EXPRESS_TEMPLATES) expect(isAvailableExpressTemplateSlug(template.slug)).toBe(true);
    for (const template of EXPRESS_TEMPLATES.filter((item) => item.status === "coming")) expect(isAvailableExpressTemplateSlug(template.slug)).toBe(false);
    expect(isAvailableExpressTemplateSlug("made-up-template")).toBe(false);
  });
});
