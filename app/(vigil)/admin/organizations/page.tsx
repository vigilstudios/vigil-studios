import type { Metadata } from "next";
import Link from "next/link";
import OrganizationsDirectory from "./OrganizationsDirectory";
import { requireStaff } from "@/lib/vigil/auth/session";
import { listCustomerAccounts } from "@/lib/vigil/queries/accounts";
import {
  accountFilters,
  type AccountFilter,
} from "@/lib/vigil/accounts/directory";
import { CustomerAccounts } from "@/components/vigil/CustomerAccounts";
export const metadata: Metadata = { title: "Customer accounts" };
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    view?: string;
    archived?: string;
  }>;
}) {
  await requireStaff("/admin/organizations");
  const params = await searchParams;
  if (params.view === "businesses" || params.archived === "1")
    return (
      <div>
        <Link
          href="/admin/organizations"
          className="mb-5 inline-flex text-xs underline"
        >
          Customer accounts
        </Link>
        <OrganizationsDirectory searchParams={Promise.resolve(params)} />
      </div>
    );
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const filter: AccountFilter = accountFilters.includes(
    params.status as AccountFilter,
  )
    ? (params.status as AccountFilter)
    : "all";
  const page = Math.min(
    100000,
    Math.max(1, Math.floor(Number(params.page) || 1)),
  );
  return (
    <CustomerAccounts
      data={await listCustomerAccounts(filter, query, page)}
      filter={filter}
      query={query}
      page={page}
    />
  );
}
