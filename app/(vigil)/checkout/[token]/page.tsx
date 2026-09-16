import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "../CheckoutForm";
import { CheckoutShell } from "../CheckoutShell";
import Link from "next/link";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/** A checkout link created by staff: the order is prefilled and bound to its token. */
export default async function TokenCheckoutPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ canceled?: string }> }) {
  const { token } = await params;
  const { canceled } = await searchParams;
  if (!hasAdminClient() || !/^[0-9a-f]{64}$/.test(token)) notFound();

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, email, contact_name, business_name, project_kind, template_slug, build_amount_cents, currency, plan:plans(code)")
    .eq("checkout_token", token)
    .maybeSingle();
  if (!order) notFound();

  if (order.status !== "pending") {
    return (
      <CheckoutShell title="This order is already complete">
        <p className="text-sm text-[color:var(--text-secondary)]">Thanks, payment for {order.business_name} has been received. <Link href="/login" className="underline">Sign in</Link> to continue your onboarding.</p>
      </CheckoutShell>
    );
  }

  const catalog = await getCheckoutCatalog();
  const buildRow = catalog.builds.find((b) => b.kind === order.project_kind) ?? null;
  const template = order.template_slug ? EXPRESS_TEMPLATES.find((t) => t.slug === order.template_slug) ?? null : null;
  const buildAmount = order.build_amount_cents ?? buildRow?.amount_cents ?? null;

  return (
    <CheckoutShell
      title={`Let's build ${order.business_name}`}
      subtitle="Vigil Studios prepared this order for you. Check the plan, confirm your details, and pay securely. Your dashboard is ready the moment it goes through."
    >
      {canceled ? (
        <p className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">Payment was cancelled. Nothing was charged; you can try again below.</p>
      ) : null}
      <CheckoutForm
        plans={catalog.plans}
        build={buildRow ? { name: buildRow.name, amountCents: buildAmount, currency: order.currency } : null}
        projectKind={order.project_kind}
        templateSlug={order.template_slug}
        templateName={template?.industry ?? (order.project_kind === "professional" ? "Up to 8 custom pages" : order.project_kind === "custom" ? "Custom design" : null)}
        initial={{ email: order.email, businessName: order.business_name, contactName: order.contact_name ?? undefined, planCode: order.plan?.code }}
        locked={{ orderId: order.id, checkoutToken: token }}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL ?? null}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
