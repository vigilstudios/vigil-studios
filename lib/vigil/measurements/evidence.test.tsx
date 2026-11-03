import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FakeAdmin } from "@/lib/vigil/__tests__/fake-admin";
import {
  getWebsiteMeasurements,
  overviewMeasurementData,
} from "@/lib/vigil/queries/measurements";
import { measurementTarget, runMeasurementBatch } from "./service";
import { securityState } from "@/lib/vigil/overview/monitoring";
import { WebsiteMeasurementsView } from "@/components/vigil/WebsiteMeasurements";
import { runnerState, type MeasurementConnectionView } from "./contract";

const now = "2026-11-02T12:00:00.000Z",
  origin = "https://client.example.com";
const connection = {
  id: "connection-a",
  organization_id: "org-a",
  website_id: "site-a",
  kind: "repository_security",
  enabled: true,
  revision: 2,
  last_error_code: null,
  last_attempt_at: now,
  last_success_at: now,
  next_run_at: now,
  lease_token: "private-lease",
};
const payload = {
  kind: "repository_security" as const,
  complete: true,
  openCount: 1,
  findings: [
    {
      reference: "opaque-reference",
      title: "Update vulnerable dependency",
      severity: "critical" as const,
      detectedAt: now,
    },
  ],
};
const snapshot = {
  id: "snapshot",
  organization_id: "org-a",
  website_id: "site-a",
  connection_id: "connection-a",
  connection_revision: 2,
  target_origin: origin,
  observed_at: now,
  expires_at: "2026-11-04T12:00:00.000Z",
  coverage: "complete",
  payload,
};
function database(patch: Record<string, unknown> = {}) {
  return new FakeAdmin({
    organizations: [{ id: "org-a", archived_at: null }],
    websites: [
      {
        id: "site-a",
        organization_id: "org-a",
        status: "live",
        live_url: origin,
      },
    ],
    website_measurement_connections: [{ ...connection, ...patch }],
    website_measurement_snapshots: [snapshot],
  });
}
afterEach(() => vi.unstubAllEnvs());
describe("tenant evidence reads", () => {
  it("requires the selected site in the requested organization before reading evidence", async () => {
    const db = database();
    expect(
      await getWebsiteMeasurements(db.asClient(), "org-b", "site-a", now),
    ).toEqual({ available: false, connections: [] });
  });
  it.each([
    { connection_revision: 1 },
    { organization_id: "org-b" },
    { website_id: "site-b" },
    { target_origin: "https://other.example.com" },
    { observed_at: "2026-11-03T00:00:00Z" },
  ])("excludes wrongly scoped or future evidence %j", async (patch) => {
    const db = database();
    db.tables.set("website_measurement_snapshots", [{ ...snapshot, ...patch }]);
    expect(
      (await getWebsiteMeasurements(db.asClient(), "org-a", "site-a", now))
        .connections[0].payload,
    ).toBeNull();
  });
  it("does not expose leases or provider identity in the client read model", async () => {
    const view = await getWebsiteMeasurements(
      database().asClient(),
      "org-a",
      "site-a",
      now,
    );
    expect(JSON.stringify(view)).not.toContain("private-lease");
    expect(view.connections[0].payload).toEqual(payload);
  });
  it("retains last known alerts when a later provider call fails", async () => {
    const data = await getWebsiteMeasurements(
      database({ last_error_code: "permission_required" }).asClient(),
      "org-a",
      "site-a",
      now,
    );
    expect(data.connections[0].state).toBe("attention");
    const overview = overviewMeasurementData(data);
    expect(overview.security?.alerts).toHaveLength(1);
    expect(securityState(overview.security, now)).toBe("alert");
  });
  it("does not reuse evidence after disconnection and never claims broad security coverage", async () => {
    const disconnected = await getWebsiteMeasurements(
      database({ enabled: false }).asClient(),
      "org-a",
      "site-a",
      now,
    );
    expect(disconnected.connections[0]).toMatchObject({
      state: "not_connected",
      payload: null,
    });
    const db = database();
    db.tables.set("website_measurement_snapshots", [
      { ...snapshot, payload: { ...payload, openCount: 0, findings: [] } },
    ]);
    const overview = overviewMeasurementData(
      await getWebsiteMeasurements(db.asClient(), "org-a", "site-a", now),
    );
    expect(overview.security?.checks).toEqual({
      vulnerabilities: "clear",
      firewall: "unknown",
      activity: "unknown",
      exploits: "unknown",
    });
    expect(securityState(overview.security, now)).toBe("pending");
  });
  it("shows stale evidence explicitly without clearing unresolved findings", async () => {
    const data = await getWebsiteMeasurements(
      database().asClient(),
      "org-a",
      "site-a",
      "2026-11-10T00:00:00Z",
    );
    expect(data.connections[0].state).toBe("stale");
    const html = renderToStaticMarkup(<WebsiteMeasurementsView data={data} />);
    expect(html).toContain("Update overdue");
    expect(html).toContain("Update vulnerable dependency");
  });
});
describe("measurement runner", () => {
  it("performs no database or provider work while globally paused", async () => {
    const admin = database(),
      from = vi.spyOn(admin, "from"),
      collect = vi.fn();
    expect(
      await runMeasurementBatch(admin.asClient(), { enabled: false, collect }),
    ).toEqual({ enabled: false, results: [] });
    expect(from).not.toHaveBeenCalled();
    expect(collect).not.toHaveBeenCalled();
  });
  it("rejects another organization's target even with a privileged database client", async () => {
    await expect(
      measurementTarget(database().asClient(), {
        ...connection,
        organization_id: "org-b",
      }),
    ).rejects.toMatchObject({ code: "website_unavailable" });
  });
  it("saves safe connection errors when the provider mapping is missing", async () => {
    const db = database();
    const rpc = vi.spyOn(db, "rpc").mockImplementation(
      async (name) =>
        ({
          data: name === "claim_website_measurement" ? [connection] : true,
          error: null,
        }) as never,
    );
    const collect = vi.fn();
    const result = await runMeasurementBatch(db.asClient(), {
      enabled: true,
      now: new Date(now),
      collect,
    });
    expect(collect).not.toHaveBeenCalled();
    expect(result.results[0]).toMatchObject({
      status: "failed",
      errorCode: "invalid_mapping",
    });
    expect(rpc).toHaveBeenCalledWith(
      "finish_website_measurement",
      expect.objectContaining({ p_error: "invalid_mapping", p_origin: origin }),
    );
  });
  it("bounds an invocation to two claims and treats invalidated commits as discarded", async () => {
    const db = database();
    db.tables.set("provider_links", [
      {
        entity_type: "website",
        entity_id: "site-a",
        provider: "other",
        resource_kind: "repository",
        external_id: "opaque",
        metadata: { full_name: "org/client" },
      },
    ]);
    const rpc = vi.spyOn(db, "rpc").mockImplementation(
      async (name) =>
        ({
          data: name === "claim_website_measurement" ? [connection] : false,
          error: null,
        }) as never,
    );
    const collect = vi.fn().mockResolvedValue(payload);
    const result = await runMeasurementBatch(db.asClient(), {
      enabled: true,
      now: new Date(now),
      limit: 100,
      collect,
    });
    expect(
      rpc.mock.calls.filter(([name]) => name === "claim_website_measurement"),
    ).toHaveLength(2);
    expect(result.results.map((r) => r.status)).toEqual([
      "discarded",
      "discarded",
    ]);
  });
  it("does not persist upstream secret messages in an error", async () => {
    const db = database({ kind: "site_security" });
    const rpc = vi.spyOn(db, "rpc").mockImplementation(
      async (name) =>
        ({
          data:
            name === "claim_website_measurement"
              ? [{ ...connection, kind: "site_security" }]
              : true,
          error: null,
        }) as never,
    );
    const collect = vi
      .fn()
      .mockRejectedValue(new Error("https://source/?key=secret"));
    await runMeasurementBatch(db.asClient(), {
      enabled: true,
      now: new Date(now),
      collect,
    });
    expect(rpc).toHaveBeenCalledWith(
      "finish_website_measurement",
      expect.objectContaining({ p_error: "invalid_response" }),
    );
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("secret");
  });
  it("carries the actual lab audit timestamp into stored evidence", async () => {
    const db = database();
    const measuredAt = "2026-11-02T10:00:00.000Z";
    const rpc = vi.spyOn(db, "rpc").mockImplementation(
      async (name) =>
        ({
          data:
            name === "claim_website_measurement"
              ? [{ ...connection, kind: "quality_mobile" }]
              : true,
          error: null,
        }) as never,
    );
    const collect = vi.fn().mockResolvedValue({
      kind: "quality",
      device: "mobile",
      measuredAt,
      auditVersion: "13",
      seo: 90,
      performance: 80,
      accessibility: null,
      bestPractices: null,
      lcpMs: 2200,
      fcpMs: null,
      tbtMs: null,
      cls: null,
      issues: [],
    });
    await runMeasurementBatch(db.asClient(), {
      enabled: true,
      now: new Date(now),
      collect,
    });
    expect(rpc).toHaveBeenCalledWith(
      "finish_website_measurement",
      expect.objectContaining({ p_observed: measuredAt }),
    );
  });
});
describe("report presentation", () => {
  it("flags missed or hung runner execution and paused websites", async () => {
    expect(
      runnerState(
        {
          status: "running",
          started_at: "2026-11-02T11:00:00Z",
          finished_at: null,
        },
        Date.parse(now),
      ),
    ).toBe("overdue");
    expect(
      runnerState(
        { status: "ok", started_at: now, finished_at: now },
        Date.parse(now),
      ),
    ).toBe("healthy");
    expect(
      runnerState(
        { status: "error", started_at: now, finished_at: now },
        Date.parse(now),
      ),
    ).toBe("attention");
    const db = database();
    db.rows("websites")[0].status = "paused";
    expect(
      (await getWebsiteMeasurements(db.asClient(), "org-a", "site-a", now))
        .connections[0].state,
    ).toBe("paused");
  });
  it("does not substitute fake scores for unconnected sources", () => {
    const html = renderToStaticMarkup(
      <WebsiteMeasurementsView data={{ available: true, connections: [] }} />,
    );
    expect(html).toContain("Not connected");
    expect(html).not.toContain("/100");
    expect(html).not.toContain("0 visitors");
  });
  it("explains small-site field data and globally paused collection", () => {
    const field: MeasurementConnectionView = {
      id: "field",
      kind: "field_performance",
      enabled: true,
      revision: 1,
      lastAttemptAt: now,
      lastSuccessAt: now,
      nextRunAt: now,
      state: "insufficient",
      observedAt: now,
      expiresAt: now,
      payload: {
        kind: "field",
        formFactor: "PHONE",
        sufficient: false,
        lcpMs: null,
        inpMs: null,
        cls: null,
        periodStart: null,
        periodEnd: null,
      },
    };
    const html = renderToStaticMarkup(
      <WebsiteMeasurementsView
        data={{ available: true, updatesEnabled: false, connections: [field] }}
      />,
    );
    expect(html).toContain("updates are paused");
    expect(html).toContain("enough eligible real-user data");
    expect(html).not.toContain("0ms");
  });
});
