import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SecurityPanel,
  SiteQualityPanel,
} from "@/components/vigil/overview/OverviewMonitoring";
import {
  auditScore,
  securityState,
  speedSeconds,
} from "../overview/monitoring";
import { leadStatusGroups } from "../overview/model";
import { sampleOverview } from "../../../scripts/overview-preview/fixture";

const data = sampleOverview();
const report = data.security!;
describe("security monitoring truth", () => {
  it("requires a complete, current set of clear checks to claim secured", () => {
    expect(securityState(null, data.asOf)).toBe("unconnected");
    expect(securityState(report, data.asOf)).toBe("secured");
    expect(
      securityState(
        { ...report, checks: { ...report.checks, firewall: "unknown" } },
        data.asOf,
      ),
    ).toBe("pending");
  });
  it.each([
    { observedAt: "invalid" },
    { expiresAt: "invalid" },
    { observedAt: "2026-10-27T00:00:00Z" },
    { expiresAt: "2026-10-26T18:29:00Z" },
    { expiresAt: report.observedAt },
  ])(
    "does not claim secured for stale or invalid check timestamps: %j",
    (patch) => {
      expect(securityState({ ...report, ...patch }, data.asOf)).toBe("pending");
    },
  );
  it("retains unresolved alerts even when checks expire or an individual check is missing", () => {
    const flagged = sampleOverview(false, false, true).security!;
    expect(securityState({ ...flagged, expiresAt: "invalid" }, data.asOf)).toBe(
      "alert",
    );
    expect(
      securityState(
        { ...report, checks: { ...report.checks, exploits: "alert" } },
        data.asOf,
      ),
    ).toBe("alert");
    expect(
      securityState({ ...report, alerts: flagged.alerts }, data.asOf),
    ).toBe("alert");
  });
  it("never substitutes passing SSL or DNS for a threat monitoring connection", () => {
    const disconnected = sampleOverview(false, true);
    const html = renderToStaticMarkup(<SecurityPanel data={disconnected} />);
    expect(html).toContain("Monitoring not connected");
    expect(html).not.toContain("Secured");
    expect(html).not.toContain("Protected");
    expect(html).not.toContain("Alerts · 0");
  });
  it("renders the secured and warning states from the supplied report", () => {
    expect(renderToStaticMarkup(<SecurityPanel data={data} />)).toContain(
      "Secured",
    );
    const html = renderToStaticMarkup(
      <SecurityPanel data={sampleOverview(false, false, true)} />,
    );
    expect(html).toContain("Attention required");
    expect(html).toContain("Alerts · 1");
  });
  it("keeps expired alerts visible without reporting stale firewall checks as protected", () => {
    const data = sampleOverview(false, false, true);
    data.security!.expiresAt = "2026-10-26T18:29:00Z";
    const html = renderToStaticMarkup(<SecurityPanel data={data} />);
    expect(html).toContain("Attention required");
    expect(html).toContain("Pending");
    expect(html).not.toContain("Protected");
    data.security!.alerts = [];
    data.security!.checks.activity = "clear";
    expect(renderToStaticMarkup(<SecurityPanel data={data} />)).toContain(
      "Alerts · Pending",
    );
  });
});
describe("site quality metrics", () => {
  it("preserves a genuine zero score and rejects missing, nonfinite and out-of-range measurements", () => {
    expect(auditScore(0)).toBe(0);
    expect(auditScore(100)).toBe(100);
    for (const value of [null, undefined, NaN, Infinity, -1, 101])
      expect(auditScore(value)).toBeNull();
    expect(speedSeconds(1800)).toBe(1.8);
    expect(speedSeconds(0)).toBe(0);
    for (const value of [null, undefined, NaN, Infinity, -1])
      expect(speedSeconds(value)).toBeNull();
  });
  it("shows an unconnected audit without fabricated scores", () => {
    const html = renderToStaticMarkup(
      <SiteQualityPanel data={sampleOverview(false, true)} />,
    );
    expect(html).toContain("Audit not connected");
    expect(html).toContain("Not measured");
    expect(html).not.toContain("aria-valuenow");
    expect(html).not.toContain("/100");
  });
  it("labels the recorded speed as LCP and gives the audit device context", () => {
    const html = renderToStaticMarkup(<SiteQualityPanel data={data} />);
    expect(html).toContain("Largest Contentful Paint");
    expect(html).toContain("1.8");
    expect(html).toContain("Mobile audit");
  });
});
describe("compact lead status groups", () => {
  it.each([7, 30, 90] as const)(
    "preserves all statuses and cohort totals for %d days",
    (range) => {
      const report = data.reports[range];
      const groups = leadStatusGroups(report);
      expect(groups.reduce((sum, group) => sum + group.value, 0)).toBe(
        report.total,
      );
      expect(groups.find((group) => group.label === "In progress")?.value).toBe(
        report.stages
          .filter((stage) =>
            ["contacted", "qualified", "booked"].includes(stage.key),
          )
          .reduce((sum, stage) => sum + stage.value, 0),
      );
    },
  );
});
