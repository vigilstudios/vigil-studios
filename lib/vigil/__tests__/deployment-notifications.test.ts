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
