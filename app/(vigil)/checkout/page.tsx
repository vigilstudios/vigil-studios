import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Metadata } from "next";
import { publishedExpressTemplates } from "@/lib/vigil/express/library";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutShell } from "./CheckoutShell";
import {
  checkoutReturnPath,
  requireCheckoutViewer,
} from "@/lib/vigil/auth/checkout-access";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

/**
 * Self-serve checkout, reached from the Express catalogue or the guided
 * Professional fit check:
 *   /checkout?template=<slug>            (also accepts client_reference_id)
 *   /checkout?build=professional
 * Custom builds start from a staff-created link instead.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    template?: string;
    client_reference_id?: string;
    build?: string;
    canceled?: string;
    plan?: string;
    period?: string;
    promo?: string;
  }>;
}) {
  const params = await searchParams;
  const viewer = await requireCheckoutViewer(checkoutReturnPath(params));
  const projectKind =
    params.build === "professional" ? "professional" : "express";
  const slug = params.template ?? params.client_reference_id ?? null;
  const template =
    projectKind === "express" && slug
      ? ((await publishedExpressTemplates()).find(
          (t) => t.slug === slug && t.status === "available",
        ) ?? null)
      : null;
  if (projectKind === "express" && !template)
    return (
      <CheckoutShell title="Choose your Express design" subtitle="Preview a design before choosing a plan and paying.">
        <Link href="/express" className="btn-primary min-h-11">Browse Express designs</Link>
      </CheckoutShell>
    );
  const catalog = await getCheckoutCatalog();
  const build = catalog.builds.find((b) => b.kind === projectKind) ?? null;

  return (
    <CheckoutShell
      title={
        projectKind === "professional"
          ? "Your Professional website"
          : template
            ? `Your ${template.industry} website`
            : "Start your Vigil website"
      }
      subtitle="Review your build and choose the Vigil plan that goes with it."
    >
      {params.canceled ? (
        <p className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">
          Payment was cancelled. Nothing was charged; pick up where you left off
          below.
        </p>
      ) : null}
      <CheckoutForm
        requestId={randomUUID()}
        plans={catalog.plans}
        build={
          build?.synced
            ? {
                name: build.name,
                amountCents: build.amount_cents,
                currency: build.currency,
              }
            : null
        }
        projectKind={projectKind}
        templateSlug={template?.slug ?? null}
        templateName={
          template ? `${template.industry} · ${template.variant}` : null
        }
        initial={{
          planCode: params.plan,
          billingPeriod: params.period,
          promotionCode: params.promo,
        }}
        accountEmail={viewer.user.email!}
        locked={null}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL || "/terms"}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
