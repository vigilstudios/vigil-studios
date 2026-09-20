import { CREATIVE_SCHEMA_VERSION } from "../creative/config";
import type { WorkspaceRepository } from "../creative/publish";
import type { CreativeIntelligence } from "../creative/schema";
import type { CreativeModelProvider, TerraInput, TerraResult } from "../creative/terra";
import { gitBlobSha } from "../creative/workspace";
import { GitHubRefMovedError } from "../providers/github";

/** A complete, valid Terra answer for a small cigar lounge brief. */
export function sampleIntelligence(overrides: Partial<CreativeIntelligence> = {}): CreativeIntelligence {
  return {
    schemaVersion: CREATIVE_SCHEMA_VERSION,
    project: { summary: "A boutique cigar lounge wants a site that books tastings.", businessContext: "Independent lounge, one location, evening trade.", offeringSummary: "Cigars, tastings, private room.", primaryObjective: "Bookings for tastings", secondaryObjectives: ["Membership enquiries"] },
    audience: { segments: [{ name: "Regulars", description: "Members who visit weekly.", needs: ["Events calendar"], confidence: "stated" }], conversionActions: ["Book a tasting"], decisionFactors: ["Atmosphere"] },
    brand: { traits: ["warm", "unhurried"], desiredPerception: "A private club that welcomes you.", voice: "Low, confident.", positioning: "The lounge for people who take their time.", differentiators: [{ statement: "Walk-in humidor", confidence: "stated", basis: "about.different" }] },
    preferences: { likes: [{ statement: "Dark wood, brass", confidence: "stated", basis: "brand.direction" }], dislikes: [{ statement: "Neon", confidence: "stated", basis: "brand.avoid" }], references: [], colourDirection: "From the logo.", mustHaves: ["Booking form"], mustAvoid: ["Neon"] },
    requirements: { pages: [{ path: "/", title: "Home", purpose: "Book", origin: "required", keyContent: ["Hero"] }], features: ["booking"], content: { status: "partial", notes: "Menu supplied." }, constraints: [], targetLaunch: null },
    assets: { available: ["Logo SVG"], gaps: ["Interior photography"], notes: "" },
    visual: { opportunities: [{ idea: "Slow smoke reveal", why: "Matches the unhurried trait", risk: "Performance on mobile" }], risks: ["Too dark to read"], mobileConsiderations: ["Keep the booking CTA sticky"] },
    content: { strategy: "Lead with atmosphere, then the booking.", messagingPillars: [{ pillar: "Take your time", support: ["No table limits"] }], heroDirection: "One line, one image.", proofPoints: [] },
    sitemap: { primaryNavigation: ["Home", "Tastings"], pages: [{ path: "/tastings", title: "Tastings", purpose: "Book", origin: "proposed", keyContent: ["Calendar"] }], rationale: "Short and direct." },
    unknowns: { assumptions: [{ statement: "Open evenings only", confidence: "inferred", basis: null }], ambiguities: ["Whether walk-ins are welcome"], missingInputs: ["Opening hours"], conflicts: [] },
    guidance: { forAstra: ["Protect the unhurried tone."], questionsForHuman: ["Confirm the hours."], signatureOpportunities: ["Humidor as a 3D moment"], restraint: ["No stock lounge photography"] },
    ...overrides,
  };
}

/** A model that answers from a fixture and counts its calls. */
export class FakeModel implements CreativeModelProvider {
  readonly name = "openai" as const;
  readonly modelId = "gpt-5.6-terra";
  calls: TerraInput[] = [];
  constructor(private readonly answer: () => TerraResult = () => ({ ok: true, intelligence: sampleIntelligence(), usage: { inputTokens: 10, outputTokens: 20, responseId: "resp_1", durationMs: 5 } })) {}
  async normalize(input: TerraInput): Promise<TerraResult> {
    this.calls.push(input);
    return this.answer();
  }
}

/** An in-memory repository with one branch, real blob shas and a commit log. */
export class FakeRepo implements WorkspaceRepository {
  files = new Map<string, string | Buffer>();
  commits: { message: string; paths: string[] }[] = [];
  /** Make the next ref update fail once, as if someone else pushed. */
  moveRefOnce = false;
  failCommit: Error | null = null;
  private head = 0;

  constructor(seed: Record<string, string> = { "site/index.html": "<html></html>", "README.md": "# repo" }) {
    for (const [path, content] of Object.entries(seed)) this.files.set(path, content);
  }

  read(path: string): string | undefined {
    const value = this.files.get(path);
    return value === undefined ? undefined : Buffer.isBuffer(value) ? value.toString("utf8") : value;
  }

  async getBranchHead(_fullName: string, branch: string) {
    return { branch, commitSha: `commit_${this.head}`, treeSha: `tree_${this.head}` };
  }

  async listTree(_fullName: string, _treeSha: string, prefix: string) {
    const out = new Map<string, string>();
    for (const [path, content] of this.files) if (path.startsWith(prefix)) out.set(path, gitBlobSha(content));
    return out;
  }

  async commitFiles(_fullName: string, input: { branch: string; parentSha: string; message: string; files: { path: string; content: Buffer | string }[] }) {
    if (this.failCommit) throw this.failCommit;
    if (input.parentSha !== `commit_${this.head}`) throw new GitHubRefMovedError(input.branch);
    if (this.moveRefOnce) {
      this.moveRefOnce = false;
      this.head += 1;
      throw new GitHubRefMovedError(input.branch);
    }
    for (const file of input.files) this.files.set(file.path, file.content);
    this.head += 1;
    this.commits.push({ message: input.message, paths: input.files.map((f) => f.path) });
    return { commitSha: `commit_${this.head}`, treeSha: `tree_${this.head}` };
  }
}

/** A finished onboarding brief for the fixtures above. */
export function sampleBrief() {
  return {
    version: 3,
    basics: { businessName: "Ember & Oak", tagline: "Take your time.", phone: "555-0100", email: "hello@emberoak.test", address: { line1: "12 Vine St", line2: "", city: "Austin", region: "TX", postal: "78701", country: "USA" }, hours: { sameEveryDay: false, byAppointment: false, days: [{ day: "fri", closed: false, open: "17:00", close: "23:00" }], notes: "" } },
    kickoff: { mode: "guided", callBooked: false },
    strategy: { primaryGoal: "bookings", success: "Tastings booked every weekend", audience: "Professionals 30-55", estimatedPageCount: 4, pages: ["home", "about", "contact"], otherPages: "Tastings", features: ["booking"], featureNotes: "", contentStatus: "partial", references: [{ url: "https://example.com/ref", notes: "Love the mood" }], approver: { name: "Dana", email: "dana@private.test" }, targetLaunch: "November", notes: "" },
    offerings: { noun: "menu", sections: [{ id: "s1", name: "Cigars", items: [{ id: "i1", name: "House blend", description: "Mild", price: "$18" }] }], notes: "" },
    about: { story: "Started in a garage humidor.", different: "Walk-in humidor", hero: "Take your time." },
    brand: { colours: { mode: "logo", primary: "", secondary: "" }, social: { instagram: "@emberoak", facebook: "", tiktok: "", google: "", yelp: "", other: "" }, direction: "Dark wood, brass", avoid: "Neon", notes: "" },
    domain: { answer: "own", hostname: "emberoak.test", registrar: "godaddy", domainId: "6f1d2c3b-4a5e-4f60-8a71-9b2c3d4e5f60", preferredNames: [], delegate: false, later: false },
    progress: { lastStep: "review", completed: ["basics", "strategy", "offerings", "about", "brand", "domain"] },
  };
}
