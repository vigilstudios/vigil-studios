import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WebsitePreviewWorkspace, type WebsitePreviewWorkspaceProps } from "@/components/vigil/overview/WebsitePreviewWorkspace";
import { PreviewOverview } from "@/components/vigil/overview/PreviewOverview";
import { WebsitePanel } from "@/components/vigil/overview/OverviewPanels";
import { sampleOverview } from "../../../scripts/overview-preview/fixture";
import type { Domain, Project, Website } from "@/lib/vigil/types";
import type { ExpressPreviewReview } from "@/lib/vigil/express-preview-review";
import type { ProjectReviews } from "@/lib/vigil/queries/reviews";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/vigil/actions/express-preview", () => ({ approveExpressPreview: vi.fn(), requestExpressPreviewChanges: vi.fn() }));

const project = (kind: Project["kind"] = "express") => ({ id: "project-a", kind, status: "in_progress", name: "Website project", brief: {}, template_slug: kind === "express" ? "creator" : null, intake_completed_at: "2026-10-27T10:00:00Z", created_at: "2026-10-27T09:00:00Z", launch_target: null }) as Project;
const website = { id: "site-a", project_id: "project-a", name: "Customer website", status: "building", live_url: null, preview_url: "https://build-a.vercel.app", export_eligible: true, code_ownership: "customer_owned", health_ok: null, last_health_at: null } as Website;
const domain = { id: "domain-a", website_id: "site-a", hostname: "example.com", status: "connected", dns_ok: true, ssl_ok: true, verification: {} } as Domain;
const review = (status: ExpressPreviewReview["status"] = "awaiting_feedback"): ExpressPreviewReview => ({ roundId: "round-a", projectId: "project-a", status, currentSubmissionId: "version-a", previewUrl: website.preview_url, version: 1, feedback: null, changesUsed: 0, changesRemaining: 1 });
const props = (overrides: Partial<WebsitePreviewWorkspaceProps> = {}): WebsitePreviewWorkspaceProps => ({ website, project: project(), domain: null, preview: { kind: "live", src: website.preview_url!, address: "build-a.vercel.app" }, accent: "#12bf60", deployments: [], professionalReview: null, expressReview: null, canExport: true, canRequest: false, planActive: true, ...overrides });
const render = (overrides: Partial<WebsitePreviewWorkspaceProps> = {}) => renderToStaticMarkup(<WebsitePreviewWorkspace {...props(overrides)} />);
const renderOverview = (connected: Domain | null) => renderToStaticMarkup(<PreviewOverview organizationName="Customer" website={website} project={project()} domain={connected} subscription={null} activity={[]} deployments={[]} preview={{ kind: "template", src: "/express-preview/creator", address: "creator.preview" }} previewAccent="#12bf60" professionalReview={null} expressReview={null} domainIntents={[]} features={[]} />);

describe("preview workspace and review truth", () => {
  it.each([["express", "Vigil Express"], ["professional", "Professional Site"], ["custom", "Growth Site"]] as const)("renders the %s build in the shared workspace", (kind, label) => {
    expect(render({ project: project(kind) })).toContain(label);
  });
  it("clearly labels an Express example without offering approval", () => {
    const html = render({ preview: { kind: "template", src: "/express-preview/creator", address: "creator.preview" }, expressReview: review() });
    expect(html).toContain("Your selected Express design");
    expect(html).toContain("Example design.");
    expect(html).not.toContain("Approve preview");
    expect(html).not.toContain("Build preview ready");
  });
  it("does not claim an unbuilt Professional website is ready", () => {
    const html = render({ project: project("professional"), preview: { kind: "none" } });
    expect(html).toContain("A first look, made for your business");
    expect(html).toContain("Design in progress");
    expect(html).not.toContain("Open full preview");
    expect(html).not.toContain("Approve preview");
  });
  it("retains approval and the included Express feedback action on a real published review", () => {
    const html = render({ expressReview: review() });
    expect(html).toContain("Approve preview");
    expect(html).toContain("Request changes");
    expect(html).toContain("express-decision-embedded");
    expect(html).toContain('aria-expanded="false"');
  });
  it("does not re-offer a used Express revision", () => {
    const html = render({ expressReview: { ...review(), changesRemaining: 0, changesUsed: 1 } });
    expect(html).toContain("Approve preview");
    expect(html).not.toContain(">Request changes<");
  });
  it.each(["changes_requested", "revision_in_progress", "approved"] as const)("retains the %s decision state without duplicate submission actions", status => {
    const html = render({ expressReview: review(status) });
    expect(html).toContain(status === "approved" ? "Preview approved" : "Your changes are with the team");
    expect(html).not.toContain("Approve preview");
  });
  it("routes Professional decisions to their existing two-round review flow", () => {
    const professionalReview = { project: { id: "project-a" }, rounds: [{ number: 1, status: "approved", currentSubmissionId: "version-a" }, { number: 2, status: "awaiting_feedback", currentSubmissionId: "version-b" }] } as ProjectReviews;
    const html = render({ project: project("professional"), professionalReview });
    expect(html).toContain('href="/dashboard/review"');
    expect(html).toContain("Open design review");
    expect(html).toContain("Design direction");
    expect(html).toContain("Full-site review");
    expect(html).not.toContain("Approve preview");
  });
  it("points approved Professional builds to unfinished launch setup rather than another review", () => {
    const professionalReview = { project: { id: "project-a" }, rounds: [{ number: 1, status: "approved", currentSubmissionId: "version-a" }, { number: 2, status: "approved", currentSubmissionId: "version-b" }] } as ProjectReviews;
    const html = render({ project: project("professional"), professionalReview });
    expect(html).toContain("Give your website a home");
    expect(html).toContain("Open domain setup");
    expect(html).not.toContain("Open design review");
  });
  it("keeps domain setup available after Express approval", () => {
    const html = render({ expressReview: review("approved") });
    expect(html).toContain("Preview approved");
    expect(html).toContain("Open domain setup");
  });
  it("retains the scoped Growth review language", () => {
    const html = render({ project: project("custom") });
    expect(html).toContain("Design reviews and revisions follow your agreed project scope.");
    expect(html).not.toContain("Express includes one revision round");
  });
});

describe("shared preview viewport", () => {
  it("uses the live overview's exact desktop aspect ratio in the new preview tab and pre-launch overview", () => {
    const ratio = (html: string) => html.match(/aspect-ratio:([^;"<]+)/)?.[1];
    const liveRatio = ratio(renderToStaticMarkup(<WebsitePanel data={sampleOverview()} />));
    expect(liveRatio).toBe("1200 / 900");
    expect(ratio(render())).toBe(liveRatio);
    expect(ratio(renderOverview(null))).toBe(liveRatio);
  });
});

describe("website tools, recorded checks and domain attention", () => {
  it("keeps export permissions visible in the interface", () => {
    expect(render()).toContain("Download site (.zip)");
    const member = render({ canExport: false });
    expect(member).not.toContain("Download site (.zip)");
    expect(member).toContain("Owners and managers can download");
    expect(render({ website: { ...website, export_eligible: false } })).not.toContain("Download site (.zip)");
  });
  it("links ongoing care requests and upgrades to their proper destinations", () => {
    expect(render({ canRequest: true })).toContain('href="/dashboard/requests"');
    const upgrade = render();
    expect(upgrade).toContain('href="/dashboard/billing"');
    expect(upgrade).not.toContain('href="/dashboard/requests"');
  });
  it("requires a recorded availability check before claiming healthy", () => {
    const unchecked = render({ website: { ...website, health_ok: true, last_health_at: null } });
    expect(unchecked).toContain("Not checked yet");
    expect(unchecked).not.toContain(">Healthy<");
    expect(render({ website: { ...website, health_ok: true, last_health_at: "2026-10-27T11:00:00Z" } })).toContain(">Healthy<");
  });
  it("uses actual domain check results without equating them with vulnerability monitoring", () => {
    const html = render({ domain });
    expect(html.match(/>Passed</g)).toHaveLength(2);
    expect(html).toContain("Domain checks are recorded separately from vulnerability monitoring.");
    expect(html).not.toContain("Complete domain setup");
    expect(html).not.toContain("Secured");
  });
  it("adds attention to missing and unfinished domains beside the setup action", () => {
    expect(renderOverview(null)).toContain("Setup needed");
    expect(renderOverview({ ...domain, status: "verifying", ssl_ok: false })).toContain("Setup needed");
    const connected = renderOverview(domain);
    expect(connected).not.toContain("Setup needed");
    expect(connected).not.toContain("Set up your domain");
    expect(renderOverview(null)).toContain('href="/dashboard/domain?website=site-a"');
  });
  it("shows a failed recorded build as failed rather than marking every release ready", () => {
    const html = render({ deployments: [{ id: "release-a", environment: "preview", status: "error", url: null, created_at: "2026-10-27T10:00:00Z", finished_at: null }] });
    expect(html).toContain("Build history");
    expect(html).toContain(">Failed<");
    expect(html).not.toContain("Your first build is ahead");
  });
});
