import { afterEach, describe, expect, it, vi } from "vitest";
import { retainAssetPreview } from "../asset-preview";
import { createDashboardRefreshController, dashboardAutoRefreshEnabled } from "../dashboard-refresh";

const now = Date.UTC(2026, 9, 8);
const signed = (issuedAt: number, path = "org/project/photo.jpg", options = "") => {
  const payload = btoa(JSON.stringify({ iat: issuedAt / 1000, exp: issuedAt / 1000 + 3600 }));
  return `https://files.test/storage/v1/object/sign/project-assets/${path}?token=header.${payload}.signature${options}`;
};

describe("private preview egress regression", () => {
  it("keeps one image URL through 57 minute-by-minute re-signs", () => {
    const initial = signed(now);
    let displayed = initial;
    for (let minute = 1; minute <= 57; minute++) {
      displayed = retainAssetPreview(displayed, signed(now + minute * 60_000));
      expect(displayed).toBe(initial);
    }
  });

  it("renews near expiry and changes immediately for another object or transform", () => {
    const initial = signed(now);
    const refreshed = signed(now + 59 * 60_000);
    expect(retainAssetPreview(initial, refreshed, now + 59 * 60_000)).toBe(refreshed);
    const other = signed(now + 60_000, "another-org/project/photo.jpg");
    expect(retainAssetPreview(initial, other, now)).toBe(other);
    const transform = signed(now + 60_000, "org/project/photo.jpg", "&width=100");
    expect(retainAssetPreview(initial, transform, now)).toBe(transform);
  });

  it("does not retain an old preview over a new upload or malformed link", () => {
    const initial = signed(now);
    expect(retainAssetPreview(initial, "blob:replacement", now)).toBe("blob:replacement");
    expect(retainAssetPreview("blob:old", initial, now)).toBe(initial);
    const invalid = initial.replace(/token=.*/, "token=invalid");
    expect(retainAssetPreview(initial, invalid, now)).toBe(invalid);
    expect(retainAssetPreview("/local/a.jpg", "/local/b.jpg", now)).toBe("/local/b.jpg");
  });
});

describe("dashboard refresh traffic", () => {
  afterEach(() => vi.useRealTimers());

  function fixture() {
    vi.useFakeTimers();
    const refresh = vi.fn();
    let visible = true;
    let online = true;
    const controller = createDashboardRefreshController({ refresh, isVisible: () => visible, isOnline: () => online });
    return { refresh, controller, visibility: (v: boolean) => { visible = v; }, network: (v: boolean) => { online = v; } };
  }

  it("does not poll or refresh on focus while Realtime is healthy", () => {
    const { refresh, controller } = fixture();
    controller.connection(true);
    for (let minute = 0; minute < 60; minute++) {
      controller.poll();
      controller.wake();
      vi.advanceTimersByTime(60_000);
    }
    expect(refresh).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("coalesces events and catches up once after a hidden tab becomes visible", () => {
    const { refresh, controller, visibility } = fixture();
    controller.connection(true);
    visibility(false);
    for (let minute = 0; minute < 60; minute++) {
      controller.changed();
      controller.poll();
      vi.advanceTimersByTime(60_000);
    }
    expect(refresh).not.toHaveBeenCalled();
    visibility(true);
    controller.wake();
    controller.changed();
    controller.changed();
    vi.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it("catches up after a brief disconnect without waiting for the fallback poll", () => {
    const { refresh, controller } = fixture();
    controller.connection(true);
    controller.connection(false);
    controller.connection(true);
    vi.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1);
    controller.poll();
    vi.advanceTimersByTime(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it("falls back only while visible and online, then stops polling after reconnect", () => {
    const { refresh, controller, visibility, network } = fixture();
    controller.connection(false);
    controller.poll();
    visibility(false);
    vi.advanceTimersByTime(250);
    expect(refresh).not.toHaveBeenCalled();
    visibility(true);
    network(false);
    controller.wake();
    vi.advanceTimersByTime(60_000);
    expect(refresh).not.toHaveBeenCalled();
    network(true);
    controller.wake();
    vi.advanceTimersByTime(250);
    expect(refresh).toHaveBeenCalledTimes(1);
    controller.connection(true);
    controller.poll();
    vi.advanceTimersByTime(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);
    controller.changed();
    controller.dispose();
    vi.advanceTimersByTime(1000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps standalone and project editors out of automatic dashboard refreshes", () => {
    expect(dashboardAutoRefreshEnabled("/admin/lab")).toBe(false);
    expect(dashboardAutoRefreshEnabled("/admin/lab/project/p1")).toBe(false);
    expect(dashboardAutoRefreshEnabled("/admin/organizations/org/files")).toBe(true);
    expect(dashboardAutoRefreshEnabled("/dashboard/website")).toBe(true);
  });
});
