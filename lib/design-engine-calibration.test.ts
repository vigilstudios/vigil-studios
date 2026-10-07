import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { typographyProfiles, getTypographyProfile, requiredFonts, typographyVariables } from "@/design-engine/foundations/typography/profiles";
import { artDirections } from "@/design-engine/foundations/art-direction";
import { typeRoles } from "@/design-engine/foundations/typography/types";
import { batch003 } from "@/design-engine/preview/calibration/batch";
import { designComponents } from "@/design-engine/registry/components";
import { FadeReveal } from "@/design-engine/motion/FadeReveal";
import { Marquee } from "@/design-engine/motion/Marquee";
import manifest from "@/design-engine/preview/fonts/manifest.json";

const luminance = (hex: string) => {
  const values = hex.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
};
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

describe("Creative Calibration 003 contracts", () => {
  it("keeps role profiles complete, portable and independently replaceable", () => {
    expect(typographyProfiles).toHaveLength(10);
    for (const profile of typographyProfiles) {
      expect(Object.keys(profile.roles)).toEqual([...typeRoles]);
      expect(requiredFonts(profile).length).toBeLessThanOrEqual(3);
      for (const role of typeRoles) {
        expect(profile.roles[role].leading).toBeGreaterThan(.8);
        expect(profile.roles[role].measure).toMatch(/ch$/);
        if (profile.roles[role].font === "plex") expect([400, 500]).toContain(profile.roles[role].weight);
      }
    }
    expect(() => getTypographyProfile("unregistered")).toThrow();
    const vars = typographyVariables(getTypographyProfile("editorial"), { fraunces: "ClientLicensedFace, Georgia, serif" });
    expect(vars).toHaveProperty("--de-font-display", "ClientLicensedFace, Georgia, serif");
    expect(vars).toHaveProperty("--de-display-axes", '"SOFT" 0, "WONK" 1, "opsz" 96');
  });
  it("keeps brand color independent from every typography and art direction pairing", () => {
    for (const typography of typographyProfiles) for (const artDirection of artDirections) {
      const html = renderToStaticMarkup(createElement(DesignThemeProvider, {
        typography, artDirection, theme: "neutral", motion: "none", overrides: { color: { accent: "#123456" } },
      }, "Preview"));
      expect(html).toContain("--de-accent:#123456");
      expect(html).toContain('data-motion="none"');
      expect(html).toContain(`data-typography="${typography.id}"`);
      expect(html).toContain(`--de-radius:${artDirection.radius}`);
    }
  });
  it("makes explicit no-motion render readable content and a single marquee track", () => {
    const html = renderToStaticMarkup(createElement(DesignThemeProvider, { motion: "none" },
      createElement(FadeReveal, null, "Visible first frame"), createElement(Marquee, { items: ["First", "Second"] })));
    expect(html).toContain("Visible first frame");
    expect(html).not.toContain("opacity:0");
    expect(html.match(/First/g)).toHaveLength(1);
    expect(html).toContain("de-marquee--still");
  });
  it("preserves licensed font binaries and limits the catalog loader to the Lab route", () => {
    for (const entry of manifest) for (const file of entry.files) {
      const path = resolve("design-engine/preview", file.path);
      expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(file.sha256);
      expect(readFileSync(resolve(dirname(path), "LICENSE"), "utf8")).toMatch(/SIL OPEN FONT LICENSE/i);
    }
    const loader = readFileSync("design-engine/preview/lab-fonts.ts", "utf8");
    expect(loader.match(/preload: false/g)).toHaveLength(10);
    expect(readFileSync("app/(vigil)/layout.tsx", "utf8")).not.toContain("lab-fonts");
  });
  it("keeps twelve diverse concepts outside inventory and uses readable study palettes", () => {
    expect(batch003).toHaveLength(12);
    expect(new Set(batch003.map((c) => c.typography)).size).toBe(10);
    batch003.forEach((c, i) => {
      expect(designComponents.some((entry) => entry.id === c.id)).toBe(false);
      if (i) expect(c.typography).not.toBe(batch003[i - 1].typography);
      expect(c.industries).toHaveLength(3);
      expect(contrast(c.palette[0], c.palette[1])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.palette[0], c.palette[2])).toBeGreaterThanOrEqual(4.5);
      batch003.slice(i + 1).forEach((other) => expect(c.axes.filter((axis, j) => axis !== other.axes[j]).length).toBeGreaterThanOrEqual(3));
    });
  });
});
