"use client";

import { CampaignTracking } from "@/components/creators/CampaignTracking";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { openPurchasedBusiness } from "@/lib/vigil/actions/account";

const support = "mailto:hello@vigilstudios.co";

function OpenDashboardButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="btn-primary min-h-12 gap-2">
      {pending ? "Opening…" : "Start your website setup"} <ArrowRight size={16} aria-hidden />
    </button>
  );
}

export function SuccessPanel({
  orderId,
  status,
  businessName,
  accountOwned = false,
}: {
  orderId: string;
  status: string;
  businessName: string;
  accountOwned?: boolean;
}) {
  const router = useRouter();
  const ready = status === "provisioned";
  const waiting = status === "pending" || status === "paid";

  useEffect(() => {
    if (!waiting) return;
    // A refresh that returns the same status still needs subsequent checks.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 6_000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 60_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [waiting, router]);

  const title = ready ? "Your workspace is ready." : status === "paid" ? "Payment received." :
    status === "pending" ? "Checking your payment." : status === "refunded" ? "This order was refunded." :
    status === "expired" ? "This checkout expired." : "This payment needs a review.";

  return (
    <div className="flex w-full max-w-xl flex-col items-center text-center">
      <CampaignTracking event="creator_purchase_confirmed" confirmed={ready} dedupeKey={orderId} />
      <span className="grid size-14 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--accent)]">
        {ready ? <CheckCircle2 size={25} aria-hidden /> : <Clock size={25} aria-hidden />}
      </span>
      <div role="status">
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{businessName}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">
          {ready
            ? "Your purchase is saved. Tell us about your business in the setup guide so we can start building your site."
            : waiting
              ? "It can take a moment. Check again here or open the order from Purchases in your dashboard."
              : "Your dashboard keeps a record of this order. If you need help finishing your purchase, contact Vigil."}
        </p>
      </div>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {ready && accountOwned ? (
          <form action={openPurchasedBusiness.bind(null, orderId)}><OpenDashboardButton /></form>
        ) : (
          <Link href={waiting ? "/dashboard/purchases" : "/dashboard"} className="btn-primary min-h-12 gap-2">{waiting ? "View purchases" : "Open dashboard"} <ArrowRight size={16} aria-hidden /></Link>
        )}
        {waiting ? (
          <button type="button" onClick={() => router.refresh()} className="btn-secondary min-h-12">Check again</button>
        ) : (
          <a className="btn-secondary min-h-12" href={support}>Contact Vigil</a>
        )}
      </div>
    </div>
  );
}
