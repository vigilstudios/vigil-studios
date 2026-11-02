import { describe, expect, it } from "vitest";
import { briefCompletion, briefSchema, emptyBasics, parseBrief, resumeStep, SECTION_SCHEMAS, STEP_KEYS, stepsForProjectKind } from "../onboarding/brief";
import { assetPath, validateAssets } from "../onboarding/assets";
import { REGISTRAR_GUIDES, REGISTRAR_OPTIONS, registrarFromNameservers } from "../domain-guides";
import { afterSendLine, virtueLine, welcomeSpeech, STEP_TITLES } from "../onboarding/virtue-copy";
import { welcomeWasDeferred } from "../onboarding/constants";
import { assertLogoChoice } from "../services/onboarding-logo";
import { FakeAdmin } from "./fake-admin";

describe("selected logo requirements", () => {
  const logoFile = { organization_id: "org", project_id: "project", kind: "logo", bucket_id: "project-assets", object_path: "org/project/logo.svg", content_type: "image/svg+xml", size_bytes: 1200 };
  it("blocks an upload choice without a logo, including after its removal", async () => {
    const db = new FakeAdmin({ project_assets: [logoFile] });
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "upload", wordmark: "" })).resolves.toBeUndefined();
    db.rows("project_assets").splice(0);
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "upload", wordmark: "" })).rejects.toThrow("Upload your logo before continuing");
  });
  it.each([
    { organization_id: "other" }, { project_id: "other" }, { kind: "photo" },
    { object_path: "other/project/logo.svg" }, { size_bytes: 0 }, { content_type: "video/mp4" },
  ])("does not accept an unrelated or incomplete file: %j", async patch => {
    const db = new FakeAdmin({ project_assets: [{ ...logoFile, ...patch }] });
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "upload", wordmark: "" })).rejects.toThrow("Upload your logo before continuing");
  });
  it("allows a proposal or typed wordmark without requiring an upload", async () => {
    const db = new FakeAdmin({});
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "vigil", wordmark: "" })).resolves.toBeUndefined();
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "wordmark", wordmark: "Northline" })).resolves.toBeUndefined();
    await expect(assertLogoChoice(db.asClient(), "org", "project", { mode: "wordmark", wordmark: " " })).rejects.toThrow("Enter your wordmark text");
  });
});

describe("brief schema", () => {
  it("keeps legacy logo preferences inferable and retains typed wordmarks across choices", () => {
    expect(SECTION_SCHEMAS.brand.parse({}).logo).toEqual({ mode: null, wordmark: "" });
    const brand = SECTION_SCHEMAS.brand.parse({ logo: { mode: "wordmark", wordmark: "Northline Studio" } });
    expect(parseBrief({ brand }).brand?.logo).toEqual({ mode: "wordmark", wordmark: "Northline Studio" });
    expect(SECTION_SCHEMAS.brand.parse({ ...brand, logo: { ...brand.logo, mode: "vigil" } }).logo.wordmark).toBe("Northline Studio");
    expect(SECTION_SCHEMAS.brand.safeParse({ logo: { mode: "wordmark", wordmark: "x".repeat(161) } }).success).toBe(false);
  });
  it("defers Virtue only for the project that chose to look around", () => {
    expect(welcomeWasDeferred("project-a", "project-a")).toBe(true);
    expect(welcomeWasDeferred("project-a", "project-b")).toBe(false);
    expect(welcomeWasDeferred("1", "project-a")).toBe(false);
    expect(welcomeWasDeferred(undefined, "project-a")).toBe(false);
  });

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

  it("keeps existing briefs readable when opening-hours applicability is absent", () => {
    const brief = parseBrief({ basics: { businessName: "Studio", hours: { byAppointment: true } } });
    expect(brief.basics?.hours.notApplicable).toBe(false);
    expect(brief.basics?.hours.byAppointment).toBe(true);
  });

  it("saves the no-opening-hours choice without losing a previous schedule", () => {
    const basics = emptyBasics("Creator studio");
    basics.hours.days[0].open = "09:00";
    basics.hours.days[0].close = "17:00";
    basics.hours.notApplicable = true;
    const saved = SECTION_SCHEMAS.basics.parse(JSON.parse(JSON.stringify(basics)));
    expect(saved.hours.notApplicable).toBe(true);
    expect(saved.hours.days[0]).toMatchObject({ open: "09:00", close: "17:00" });
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

  it("keeps the first dashboard welcome to one spoken paragraph", () => {
    expect(welcomeSpeech({ firstName: "Ana", businessName: "Marlow & Fen" })).toHaveLength(1);
    expect(welcomeSpeech({ firstName: "Ana", businessName: "Marlow & Fen", afterPassword: true })).toHaveLength(1);
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
