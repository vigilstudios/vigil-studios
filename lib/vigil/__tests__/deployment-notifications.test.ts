import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "../email";
import { notifyCustomerDeployment } from "../services/deployment-notifications";
import { FakeAdmin } from "./fake-admin";

vi.mock("../email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../email")>()),
  sendEmail: vi.fn(async () => ({ sent: true, id: "email_1" })),
}));

const sent = vi.mocked(sendEmail);

function seed(environment: "preview" | "production") {
  return new FakeAdmin({
    organizations: [{ id: "org_1", name: "Example Co", billing_email: "owner@example.com" }],
    websites: [{ id: "site_1", organization_id: "org_1", name: "Example Co website", preview_url: "https://preview.test", live_url: "https://example.com", metadata: {} }],
    deployments: [{ id: "dep_1", organization_id: "org_1", website_id: "site_1", environment, status: "ready", url: environment === "preview" ? "https://preview.test" : "https://example.com", metadata: {} }],
    organization_members: [{ organization_id: "org_1", user_id: "user_1", status: "active" }],
  });
}

beforeEach(() => sent.mockClear());

describe("deployment customer notifications", () => {
  it("emails and creates an in-app notification when a preview is ready", async () => {
    const fake = seed("preview");
    const result = await notifyCustomerDeployment(fake.asClient(), "dep_1", "https://www.vigilstudios.co");

    expect(result).toEqual({ sent: true, alreadySent: false });
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0]).toMatchObject({
      to: "owner@example.com",
      subject: "Example Co: your website preview is ready",
    });
    expect(sent.mock.calls[0][0].text).toContain("https://preview.test");
    expect(fake.rows("notifications")[0]).toMatchObject({ user_id: "user_1", kind: "website.preview_ready", href: "/dashboard/website" });
    expect((fake.rows("websites")[0].metadata as { customer_notifications: { preview_ready_at: string } }).customer_notifications.preview_ready_at).toBeTruthy();
  });

  it("announces a live deployment and never sends the same deployment twice", async () => {
    const fake = seed("production");
    await notifyCustomerDeployment(fake.asClient(), "dep_1", "https://www.vigilstudios.co");
    const again = await notifyCustomerDeployment(fake.asClient(), "dep_1", "https://www.vigilstudios.co");

    expect(again).toEqual({ sent: true, alreadySent: true });
    expect(sent).toHaveBeenCalledTimes(1);
    expect(sent.mock.calls[0][0].subject).toBe("Example Co: your website is live");
    expect((fake.rows("deployments")[0].metadata as { customer_notification: { event: string } }).customer_notification.event).toBe("site_live");
  });
});

describe("Professional review notifications", () => {
  it("tells the customer which review is ready and sends them to the Design review page", async () => {
    const fake = seed("preview");
    fake.rows("websites")[0].project_id = "proj_1";
    fake.rows("projects").push({ id: "proj_1", organization_id: "org_1", kind: "professional", status: "review" });
    fake.rows("project_review_rounds").push(
      { id: "r1", project_id: "proj_1", organization_id: "org_1", round_number: 1, status: "approved", current_submission_id: "s1" },
      { id: "r2", project_id: "proj_1", organization_id: "org_1", round_number: 2, status: "awaiting_feedback", current_submission_id: "s2" },
    );
    fake.rows("project_review_submissions").push(
      { id: "s1", round_id: "r1", project_id: "proj_1", version: 1, preview_url: "https://one.test" },
      { id: "s2", round_id: "r2", project_id: "proj_1", version: 1, preview_url: "https://preview.test" },
    );

    await notifyCustomerDeployment(fake.asClient(), "dep_1", "https://www.vigilstudios.co");

    expect(sent.mock.calls[0][0].subject).toBe("Example Co: Full-site review is ready for review");
    expect(sent.mock.calls[0][0].text).toContain("https://www.vigilstudios.co/dashboard/review?project=proj_1");
    expect(fake.rows("notifications")[0]).toMatchObject({
      kind: "project_review.submission",
      title: "Full-site review is ready for review",
      href: "/dashboard/review?project=proj_1",
    });
  });
});
