import type { Metadata } from "next";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutShell } from "./CheckoutShell";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/**
 * Self-serve checkout, reached from the Express catalogue or the guided
 * Professional fit check:
 *   /checkout?template=<slug>            (also accepts client_reference_id)
 *   /checkout?build=professional
 * Custom builds start from a staff-created link instead.
 */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ template?: string; client_reference_id?: string; build?: string; canceled?: string; plan?: string; period?: string }> }) {
  const params = await searchParams;
  const projectKind = params.build === "professional" ? "professional" : "express";
  const slug = params.template ?? params.client_reference_id ?? null;
  const template = projectKind === "express" && slug ? EXPRESS_TEMPLATES.find((t) => t.slug === slug && t.status === "available") ?? null : null;
  const catalog = await getCheckoutCatalog();
  const build = catalog.builds.find((b) => b.kind === projectKind) ?? null;

  return (
    <CheckoutShell
      title={projectKind === "professional" ? "Your Professional website" : template ? `Your ${template.industry} website` : "Start your Vigil website"}
      subtitle={projectKind === "professional" ? "Up to eight fully custom primary pages, then a Vigil plan that hosts, secures and operates the site. After payment, book a kickoff call with our team or continue with Virtue's guided brief." : "One payment for the build, then a Vigil plan that hosts, secures and operates it — monthly, yearly or for three years. You'll be in your dashboard in a minute."}
    >
      {params.canceled ? (
        <p className="mb-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-secondary)]">Payment was cancelled. Nothing was charged; pick up where you left off below.</p>
      ) : null}
      <CheckoutForm
        plans={catalog.plans}
        build={build?.synced ? { name: build.name, amountCents: build.amount_cents, currency: build.currency } : null}
        projectKind={projectKind}
        templateSlug={template?.slug ?? null}
        templateName={projectKind === "professional" ? "Up to 8 custom pages" : template?.industry ?? null}
        initial={{ planCode: params.plan, billingPeriod: params.period }}
        locked={null}
        termsUrl={process.env.NEXT_PUBLIC_TERMS_URL ?? null}
        refundNote={process.env.NEXT_PUBLIC_REFUND_NOTE ?? null}
      />
    </CheckoutShell>
  );
}
