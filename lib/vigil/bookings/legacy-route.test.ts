import { expect, it, vi } from "vitest";
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((_: string): never => {
    throw new Error("redirected");
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));
import LegacyBookingsPage from "@/app/(vigil)/dashboard/leads/bookings/page";
it("preserves a saved appointment's site, inquiry and calendar context after the move", async () => {
  await expect(
    LegacyBookingsPage({
      searchParams: Promise.resolve({
        website: "site",
        lead: "inquiry",
        calendar: "month",
        date: "2026-11-04",
        appointment: "appointment",
        view: "history",
      }),
    }),
  ).rejects.toThrow("redirected");
  expect(redirect).toHaveBeenLastCalledWith(
    "/dashboard/bookings?website=site&lead=inquiry&calendar=month&date=2026-11-04&appointment=appointment&view=history",
  );
});
