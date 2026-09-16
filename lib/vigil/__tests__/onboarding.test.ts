import { describe, expect, it } from "vitest";
import { briefCompletion, briefSchema, emptyBasics, parseBrief, resumeStep, SECTION_SCHEMAS, STEP_KEYS, stepsForProjectKind } from "../onboarding/brief";
import { assetPath, validateAssets } from "../onboarding/assets";
import { REGISTRAR_GUIDES, REGISTRAR_OPTIONS, registrarFromNameservers } from "../domain-guides";
import { afterSendLine, virtueLine, STEP_TITLES } from "../onboarding/virtue-copy";

describe("brief schema", () => {
  it("reads garbage as an empty brief and keeps progress defaults", () => {
    const b = parseBrief("nope");
    expect(b.version).toBe(3);
    expect(b.progress).toEqual({ lastStep: "welcome", completed: [] });
    expect(parseBrief(null).basics).toBeUndefined();
  });

  it("prefills the business name and seven days of hours", () => {
    const basics = emptyBasics("Marlow & Fen");
    expect(basics.businessName).toBe("Marlow & Fen");
    expect(basics.hours.days.map((d) => d.day)).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    expect(basics.address.country).toBe("");
  });

  it("validates each section on its own", () => {
    expect(SECTION_SCHEMAS.basics.safeParse({ businessName: "" }).success).toBe(false);
    expect(SECTION_SCHEMAS.kickoff.safeParse({ mode: "call", callBooked: true }).success).toBe(true);
    expect(SECTION_SCHEMAS.strategy.safeParse({ primaryGoal: "leads", pages: ["home", "services"], features: ["contact_form"], contentStatus: "partial" }).success).toBe(true);
    expect(SECTION_SCHEMAS.offerings.safeParse({ noun: "menu", sections: [{ id: "s", name: "", items: [{ id: "i", name: "Espresso", description: "", price: "$3" }] }] }).success).toBe(true);
    expect(SECTION_SCHEMAS.brand.safeParse({ colours: { mode: "pick", primary: "not-a-colour" } }).success).toBe(false);
    expect(SECTION_SCHEMAS.domain.safeParse({ answer: "need", preferredNames: ["a.com", "b.com", "c.com", "d.com"] }).success).toBe(false);
    expect(SECTION_SCHEMAS.domain.safeParse({ answer: "own", hostname: "x.com", registrar: "godaddy" }).success).toBe(true);
  });

  it("adds kickoff and strategy only for Professional and Custom onboarding", () => {
    expect(stepsForProjectKind("express")).not.toContain("kickoff");
    expect(stepsForProjectKind("express")).not.toContain("strategy");
    expect(stepsForProjectKind("professional")).toContain("kickoff");
    expect(stepsForProjectKind("professional")).toContain("strategy");
    expect(stepsForProjectKind("custom")).toContain("strategy");
    const brief = briefSchema.parse({ basics: { businessName: "X" }, progress: { lastStep: "strategy", completed: ["strategy"] } });
    expect(resumeStep(brief, "professional")).toBe("strategy");
    expect(resumeStep(brief, "express")).toBe("basics");
    expect(briefCompletion(brief, "professional").find((item) => item.key === "strategy")?.done).toBe(true);
    expect(briefCompletion(brief, "professional").find((item) => item.key === "kickoff")?.done).toBe(false);
    expect(briefCompletion(brief, "express").some((item) => item.key === "strategy")).toBe(false);
    expect(afterSendLine("professional").body).toMatch(/confirm the site plan and timeline/i);
    expect(afterSendLine("professional").body).not.toMatch(/first look/i);
    expect(afterSendLine("professional", "call").title).toMatch(/kickoff/i);
  });

  it("resumes on the last step and reports completion per section", () => {
    const b = briefSchema.parse({ basics: { businessName: "X" }, progress: { lastStep: "about", completed: ["basics"] } });
    expect(resumeStep(b)).toBe("about");
    const c = briefCompletion(b);
    expect(c.find((x) => x.key === "basics")?.done).toBe(true);
    expect(c.find((x) => x.key === "offerings")?.done).toBe(false);
    expect(c.find((x) => x.key === "domain")?.done).toBe(false);
    const owned = briefSchema.parse({ domain: { answer: "own", hostname: "x.com" } });
    expect(briefCompletion(owned).find((x) => x.key === "domain")?.done).toBe(true);
    const later = briefSchema.parse({ domain: { answer: "own", later: true } });
    expect(briefCompletion(later).find((x) => x.key === "domain")?.done).toBe(true);
  });

  it("has a Virtue line and a title for every step", () => {
    for (const step of STEP_KEYS) {
      const line = virtueLine(step, { firstName: "Ana", businessName: "Marlow & Fen" });
      expect(line.title.length).toBeGreaterThan(0);
      expect(line.body).not.toMatch(/!/);
      expect(STEP_TITLES[step]).toBeTruthy();
    }
  });
});

describe("assets", () => {
  it("refuses the wrong type, size and count", () => {
    expect(validateAssets([{ name: "a.exe", type: "application/x-msdownload", size: 10 }], "logo")).toHaveLength(1);
    expect(validateAssets([{ name: "a.pdf", type: "application/pdf", size: 10 }], "photo")[0].reason).toMatch(/images/i);
    expect(validateAssets([{ name: "a.png", type: "image/png", size: 21 * 1024 * 1024 }], "photo")[0].reason).toMatch(/20 MB/);
    expect(validateAssets([{ name: "a.png", type: "image/png", size: 10 }], "photo", 30)[0].name).toBe("*");
    expect(validateAssets([{ name: "a.png", type: "image/png", size: 10 }], "photo")).toHaveLength(0);
  });
  it("builds the organization-prefixed path", () => {
    expect(assetPath("org", "proj", "image/svg+xml", "r")).toBe("org/proj/r.svg");
    expect(assetPath("org", "proj", "weird/type", "r")).toBe("org/proj/r.bin");
  });
});

describe("registrar guides", () => {
  it("covers every registrar the wizard offers, with a complete walkthrough", () => {
    for (const o of REGISTRAR_OPTIONS) {
      const g = REGISTRAR_GUIDES[o.key];
      expect(g.dnsPath.length).toBeGreaterThan(0);
      expect(g.conflicts.length).toBeGreaterThan(0);
      expect(g.fields.name).toBeTruthy();
      if (o.key !== "other") expect(g.loginUrl).toMatch(/^https:\/\//);
    }
  });
  it("recognises registrars by nameserver suffix", () => {
    expect(registrarFromNameservers(["ns1.domaincontrol.com", "ns2.domaincontrol.com"])).toBe("godaddy");
    expect(registrarFromNameservers(["dns1.registrar-servers.com"])).toBe("namecheap");
    expect(registrarFromNameservers(["gina.ns.cloudflare.com."])).toBe("cloudflare");
    expect(registrarFromNameservers(["ns-cloud-a1.googledomains.com"])).toBe("squarespace");
    expect(registrarFromNameservers(["ns1.example.net"])).toBeNull();
  });
});
