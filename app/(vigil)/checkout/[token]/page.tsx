import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { publishedExpressTemplates } from "@/lib/vigil/express/library";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "../CheckoutForm";
import { CheckoutShell } from "../CheckoutShell";
import Link from "next/link";
import { requireCheckoutViewer } from "@/lib/vigil/auth/checkout-access";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

/** A checkout link created by staff: the order is prefilled and bound to its token. */
export default async function TokenCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { token } = await params;
  const viewer = await requireCheckoutViewer(`/checkout/${token}`);
  const { canceled } = await searchParams;
  if (!hasAdminClient() || !/^[0-9a-f]{64}$/.test(token)) notFound();

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, email, buyer_user_id, expires_at, contact_name, business_name, project_kind, template_slug, build_amount_cents, currency, plan:plans(code)",
    )
    .eq("checkout_token", token)
    .maybeSingle();
  if (!order) notFound();
  if (
    order.buyer_user_id
      ? order.buyer_user_id !== viewer.user.id
      : order.email !== viewer.user.email!.toLowerCase()
  ) {
    return (
      <CheckoutShell title="This order belongs to another account">
        <p className="text-sm text-[color:var(--text-secondary)]">
          Sign in with the account this order was prepared for, or contact Vigil
          if it needs to be updated.
        </p>
        <Link href="/dashboard" className="btn-secondary mt-5 min-h-11 text-sm">
          Back to dashboard
        </Link>
      </CheckoutShell>
    );
  }
  if (
    order.expires_at &&
    // eslint-disable-next-line react-hooks/purity -- Request-time expiry in an async Server Component; the action rechecks before payment.
    Date.parse(order.expires_at) <= Date.now() &&
    order.status === "pending"
  )
    return (
      <CheckoutShell title="This checkout link has expired">
        <p className="text-sm">
          Contact{" "}
          <a href="mailto:hello@vigilstudios.co" className="underline">
            Vigil
          </a>{" "}
          for an updated order.
        </p>
      </CheckoutShell>
    );

  if (order.status !== "pending") {
    return (
      <CheckoutShell title="This order is already complete">
        <p className="text-sm text-[color:var(--text-secondary)]">
          Thanks, payment for {order.business_name} has been received.{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to continue your onboarding.
        </p>
      </CheckoutShell>
    );
  }

  const catalog = await getCheckoutCatalog();
  const buildRow =
    catalog.builds.find((b) => b.kind === order.project_kind) ?? null;
  const template = order.template_slug
    ? ((await publishedExpressTemplates()).find(
        (t) => t.slug === order.template_slug,
      ) ?? null)
    : null;
  const buildAmount =
    order.build_amount_cents ?? buildRow?.amount_cents ?? null;

  return (
    <CheckoutShell
      title={`Let's build ${order.business_name}`}
      subtitle="Review your prepared order and confirm your details."
    >
      {canceled ? (
        <p className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
          Payment was cancelled. Nothing was charged; you can try again below.
        </p>
      ) : null}
      <CheckoutForm
        plans={catalog.plans}
        build={
          buildRow
            ? {
                name: buildRow.name,
                amountCents: buildAmount,
                currency: order.currency,
              }
            : null
        }
        projectKind={order.project_kind}
        templateSlug={order.template_slug}
        templateName={
          template?.industry ??
          (order.project_kind === "professional"
            ? "Up to 8 tailored primary pages"
            : order.project_kind === "custom"
              ? "Custom design"
              : null)
        }
        initial={{
          email: order.email,
          businessName: order.business_name,
          contactName: order.contact_name ?? undefined,
          planCode: order.plan?.code,
        }}
        accountEmail={viewer.user.email!}
        locked={{ orderId: order.id, checkoutToken: token }}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL ?? null}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
