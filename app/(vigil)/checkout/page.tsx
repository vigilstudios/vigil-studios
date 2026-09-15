import type { Metadata } from "next";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutShell } from "./CheckoutShell";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/**
 * Self-serve checkout, reached from the Express catalogue:
 *   /checkout?template=<slug>            (also accepts client_reference_id)
 * Professional and custom builds start from a staff-created link instead.
 */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ template?: string; client_reference_id?: string; canceled?: string; plan?: string; period?: string }> }) {
  const params = await searchParams;
  const slug = params.template ?? params.client_reference_id ?? null;
  const template = slug ? EXPRESS_TEMPLATES.find((t) => t.slug === slug && t.status === "available") ?? null : null;
  const catalog = await getCheckoutCatalog();
  const build = catalog.builds.find((b) => b.kind === "express") ?? null;

  return (
    <CheckoutShell
      title={template ? `Your ${template.industry} website` : "Start your Vigil website"}
      subtitle="One payment for the build, then a Vigil plan that hosts, secures and operates it — monthly, yearly or for three years. You'll be in your dashboard in a minute."
    >
      {params.canceled ? (
        <p className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">Payment was cancelled. Nothing was charged; pick up where you left off below.</p>
      ) : null}
      <CheckoutForm
        plans={catalog.plans}
        build={build ? { name: build.name, amountCents: build.synced ? build.amount_cents : build.amount_cents, currency: build.currency } : null}
        projectKind="express"
        templateSlug={template?.slug ?? null}
        templateName={template?.industry ?? null}
        initial={{ planCode: params.plan, billingPeriod: params.period }}
        locked={null}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL ?? null}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
