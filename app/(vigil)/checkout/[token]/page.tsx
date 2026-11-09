import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { publishedExpressTemplates } from "@/lib/vigil/express/library";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "../CheckoutForm";
import { CheckoutShell } from "../CheckoutShell";
import Link from "next/link";
import { billingPeriod } from "@/lib/vigil/billing-periods";
import { getBillingProvider } from "@/lib/vigil/providers/registry";
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
      "id, status, email, buyer_user_id, expires_at, contact_name, business_name, project_kind, template_slug, build_amount_cents, currency, metadata, plan:plans(code), price:plan_prices(interval,interval_count)",
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
        <form action={`/auth/signout?next=${encodeURIComponent(`/checkout/${token}`)}`} method="post" className="mt-5 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary min-h-11 text-sm">Switch accounts</button>
          <Link href="/dashboard" className="btn-secondary min-h-11 text-sm">Back to dashboard</Link>
        </form>
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

  if (order.status !== "pending")
    redirect(`/checkout/success?order=${order.id}`);

  const sessionRef = (order.metadata as { checkout_session?: string } | null)?.checkout_session;
  if (sessionRef) {
    const session = await getBillingProvider().getCheckoutSession(sessionRef).catch(() => null);
    if (session?.status === "complete") redirect(`/checkout/success?order=${order.id}`);
    if (session?.status === "open" && session.url)
      return (
        <CheckoutShell title={`Resume payment for ${order.business_name}`} subtitle="Your order is saved. Continue to Stripe to review the same payment.">
          <a href={session.url} className="btn-primary min-h-11">Resume secure checkout</a>
          <Link href="/dashboard" className="btn-secondary ml-2 min-h-11">Back to dashboard</Link>
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
          billingPeriod: order.price ? billingPeriod(order.price.interval, order.price.interval_count)?.key : undefined,
        }}
        accountEmail={viewer.user.email!}
        locked={{ orderId: order.id, checkoutToken: token }}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL || "/terms"}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
