import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FakeAdmin } from "./fake-admin";
import { DomainEngineError } from "../domain-engine/errors";
const state = vi.hoisted(() => ({ admin: null as unknown }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
  hasAdminClient: () => true,
}));
vi.mock("../domain-engine/runtime", () => ({
  assertDomainTestDatabase: () => {},
  domainTestPayments: () => ({
    verifyWebhook: (raw: string, signature: string | null) => {
      if (signature !== "signed-test")
        throw new DomainEngineError(
          "invalid_domain_webhook",
          "Payment signature verification failed.",
          400,
        );
      return JSON.parse(raw);
    },
  }),
}));
import { POST } from "@/app/api/webhooks/domain-stripe/route";
const id = "10000000-0000-0000-0000-000000000001";
function request(
  eventId = "evt_fixture",
  type = "checkout.session.completed",
  signature = "signed-test",
) {
  return new NextRequest(
    "https://vigil.example.com/api/webhooks/domain-stripe",
    {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: JSON.stringify({
        id: eventId,
        type,
        livemode: false,
        data: {
          object: { metadata: { domain_order_id: id, organization_id: "org" } },
        },
      }),
    },
  );
}
let admin: FakeAdmin;
beforeEach(() => {
  admin = new FakeAdmin({
    domain_orders: [{ id, organization_id: "org", environment: "test" }],
  });
  state.admin = admin;
});
describe("durable domain Stripe inbox", () => {
  it("rejects an invalid signature before storing or enqueueing", async () => {
    const response = await POST(
      request("evt_bad", "checkout.session.completed", "invalid"),
    );
    expect(response.status).toBe(400);
    expect(admin.rows("webhook_events")).toHaveLength(0);
    expect(admin.rows("provisioning_jobs")).toHaveLength(0);
  });
  it("deduplicates an event and isolates its receipt from website billing", async () => {
    admin
      .rows("webhook_events")
      .push({
        id: "legacy",
        provider: "stripe",
        event_id: "evt_fixture",
        status: "processed",
      });
    expect((await POST(request())).status).toBe(200);
    expect((await POST(request())).status).toBe(200);
    expect(admin.rows("provisioning_jobs")).toHaveLength(1);
    expect(admin.rows("webhook_events").map((row) => row.event_id)).toEqual([
      "evt_fixture",
      "domain:evt_fixture",
    ]);
  });
  it("allows a later authorization event to reconcile after the checkout job finishes", async () => {
    await POST(request());
    admin.rows("provisioning_jobs")[0].status = "succeeded";
    await POST(
      request("evt_authorized", "payment_intent.amount_capturable_updated"),
    );
    expect(admin.rows("provisioning_jobs")).toHaveLength(2);
    expect(
      admin
        .rows("provisioning_jobs")
        .every(
          (row) =>
            (row.payload as { domain_order_id: string }).domain_order_id === id,
        ),
    ).toBe(true);
  });
  it("retries a failed receipt instead of dropping the order", async () => {
    admin
      .rows("webhook_events")
      .push({
        id: "receipt",
        provider: "stripe",
        event_id: "domain:evt_fixture",
        status: "failed",
        received_at: "2026-01-01T00:00:00Z",
      });
    expect((await POST(request())).status).toBe(200);
    expect(admin.rows("webhook_events")[0].status).toBe("processed");
    expect(admin.rows("provisioning_jobs")).toHaveLength(1);
  });
});
