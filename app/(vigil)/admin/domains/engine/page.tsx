import Link from "next/link";
import { updateDomainSupport } from "./actions";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { PageHeader, Card } from "@/components/vigil/ui";
import { formatDate, titleCase } from "@/lib/vigil/format";
export const metadata = { title: "Domain Engine operations" };
export default async function DomainEngineOperations() {
  await requireStaff("/admin/domains/engine");
  if (!readDomainEngineConfig().enabled) notFound();
  const client = await createClient();
  const [orders, assets, support] = await Promise.all([
    client
      .from("domain_orders")
      .select(
        "id,organization_id,fqdn,environment,registration_state,payment_state,connection_state,reason_code,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("domain_registrations")
      .select(
        "id,organization_id,fqdn,environment,registration_status,contact_verification,expires_at,renewal_mode",
      )
      .neq("registration_status", "released")
      .order("expires_at", { ascending: true })
      .limit(100),
    client
      .from("domain_support_requests")
      .select("id,organization_id,kind,status,created_at")
      .neq("status", "resolved")
      .order("created_at", { ascending: true })
      .limit(100),
  ]);
  return (
    <div>
      <PageHeader
        title="Domain Engine"
        description="Registration, payment and connection states remain separate. Unknown purchases must be reconciled before another submission."
      />
      <Link href="/admin/domains" className="text-sm underline">
        ← All domain connections
      </Link>
      {orders.error || assets.error || support.error ? (
        <Card className="mt-5">
          <p>
            The Domain Engine data model is not available. Apply the reviewed
            migrations before enabling this workspace.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mt-5">
            <h2 className="text-lg font-medium">Orders needing attention</h2>
            {orders.data?.length ? (
              orders.data.map((order) => (
                <article
                  key={order.id}
                  className="border-b border-[color:var(--border)] py-4"
                >
                  <strong>{order.fqdn}</strong>
                  <span className="ml-3 text-xs">
                    {order.environment.toUpperCase()}
                  </span>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                    Registration: {titleCase(order.registration_state)} ·
                    Payment: {titleCase(order.payment_state)} · Connection:{" "}
                    {titleCase(order.connection_state)}
                  </p>
                  {order.reason_code ? (
                    <p className="mt-1 text-sm">
                      Action: {titleCase(order.reason_code)}
                    </p>
                  ) : null}
                  <Link
                    className="mt-2 inline-block text-xs underline"
                    href={`/admin/organizations/${order.organization_id}`}
                  >
                    Customer · {order.id}
                  </Link>
                </article>
              ))
            ) : (
              <p className="mt-3 text-sm">No domain orders.</p>
            )}
          </Card>
          <Card className="mt-5">
            <h2 className="text-lg font-medium">
              Managed registrations and deadlines
            </h2>
            {assets.data?.length ? (
              assets.data.map((asset) => (
                <article
                  key={asset.id}
                  className="border-b border-[color:var(--border)] py-4"
                >
                  <strong>{asset.fqdn}</strong>
                  <p className="mt-2 text-sm">
                    {asset.environment.toUpperCase()} ·{" "}
                    {titleCase(asset.registration_status)} · Contact:{" "}
                    {titleCase(asset.contact_verification)}
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Expires{" "}
                    {asset.expires_at
                      ? formatDate(asset.expires_at)
                      : "not yet confirmed"}{" "}
                    · Renewal: {titleCase(asset.renewal_mode)}
                  </p>
                </article>
              ))
            ) : (
              <p className="mt-3 text-sm">No managed registrations.</p>
            )}
          </Card>
          <Card className="mt-5">
            <h2 className="text-lg font-medium">Domain assistance</h2>
            {support.data?.length ? (
              support.data.map((ticket) => (
                <article
                  key={ticket.id}
                  className="border-b border-[color:var(--border)] py-4"
                >
                  <p>
                    {titleCase(ticket.kind)} · {titleCase(ticket.status)}
                  </p>
                  <Link
                    className="text-sm underline"
                    href={`/admin/organizations/${ticket.organization_id}`}
                  >
                    Open customer
                  </Link>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Request {ticket.id}
                  </p>
                  <form
                    action={updateDomainSupport}
                    className="mt-3 flex gap-4 text-sm"
                  >
                    <input type="hidden" name="request_id" value={ticket.id} />
                    <button
                      name="status"
                      value="assigned"
                      className="underline"
                    >
                      Assign to me
                    </button>
                    <button
                      name="status"
                      value="resolved"
                      className="underline"
                    >
                      Mark resolved
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <p className="mt-3 text-sm">No open domain requests.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
