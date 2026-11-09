import type { Metadata } from "next";
import Link from "next/link";
import { getMyPurchases } from "@/lib/vigil/queries/account";
import { PurchaseList } from "@/components/vigil/PurchaseList";
import { Card, PageHeader } from "@/components/vigil/ui";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  const purchases = await getMyPurchases();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Purchases" description="Resume checkout, check a payment, or open the website you purchased." />
      {purchases.length ? <PurchaseList purchases={purchases} /> : (
        <Card>
          <p className="text-sm">Your website orders will appear here when you start checkout.</p>
          <Link href="/find-your-fit" className="btn-primary mt-4 min-h-11 text-sm">Find my website fit</Link>
        </Card>
      )}
    </div>
  );
}
