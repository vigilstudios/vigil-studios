import Link from "next/link";
import type { getMyPurchases } from "@/lib/vigil/queries/account";
import { formatDate } from "@/lib/vigil/format";
import { Card, StatusPill } from "./ui";

const statuses: Record<string, string> = {
  pending: "Checkout started",
  paid: "Preparing your project",
  provisioned: "Ready",
  expired: "Expired",
  failed: "Needs review",
  refunded: "Refunded",
};

export function PurchaseList({ purchases }: { purchases: Awaited<ReturnType<typeof getMyPurchases>> }) {
  return (
    <Card className="!rounded-2xl !p-5">
      <h2 className="font-semibold">Your purchases</h2>
      <div className="mt-3 divide-y divide-[color:var(--border)]">
        {purchases.map((purchase) => {
          const ready = purchase.status === "provisioned";
          const name = purchase.project_kind === "custom" ? "Growth" : purchase.project_kind === "professional" ? "Professional" : "Express";
          return (
            <div key={purchase.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-medium">{purchase.business_name}</p>
                <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{name} website · {formatDate(purchase.created_at ?? "")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={ready || purchase.status === "paid" ? "good" : "neutral"}>
                  {statuses[purchase.status ?? ""] ?? "Checking status"}
                </StatusPill>
                <Link href={`/dashboard/purchases/${purchase.id}`} className="inline-flex min-h-11 items-center text-xs font-medium underline">
                  {purchase.status === "pending" ? "Continue checkout" : "View order"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
