import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Globe,
  LockKeyhole,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getMyPurchases } from "@/lib/vigil/queries/account";
import { Card } from "./ui";
import { PurchaseList } from "./PurchaseList";

export function ProspectOverviewContent({
  name,
  purchases = [],
}: {
  name: string | null;
  purchases?: Awaited<ReturnType<typeof getMyPurchases>>;
}) {
  const firstName = name?.split(" ")[0];
  const preparing = purchases.find(
    (p) => p.status === "paid" || p.status === "provisioned",
  );
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[color:var(--text-secondary)]">
          Your workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome, ${firstName}` : "Welcome to Vigil"}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Your account is ready. Let&apos;s find the right home for your
          business.
        </p>
      </header>
      <Card className="relative overflow-hidden !rounded-2xl !p-6 sm:!p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[color:var(--accent)] opacity-[.07] blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-[11px] text-[color:var(--text-secondary)]">
            <Check size={13} />
            Account created
          </span>
          <h2 className="mt-6 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            A website that opens the door.
            <br />A workspace that keeps you moving.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[color:var(--text-secondary)]">
            Start with a few questions about your business. We&apos;ll help you
            choose your website and plan, then bring your project, customers and
            day-to-day work together here.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={
                preparing
                  ? `/checkout/success?order=${preparing.id}`
                  : "/find-your-fit"
              }
              className="btn-primary inline-flex min-h-12 items-center gap-3 !px-6 text-sm"
            >
              {preparing ? "View your purchase" : "Get started"}{" "}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/express"
              className="btn-secondary inline-flex min-h-12 items-center !px-5 text-sm"
            >
              Explore Express websites
            </Link>
          </div>
          <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
            {preparing
              ? "Your purchase is being prepared. Your project will appear here when it is ready."
              : "Explore at your pace. You haven't purchased a website yet."}
          </p>
        </div>
      </Card>
      {!!purchases.length && <PurchaseList purchases={purchases} />}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Room for your business to grow
          </h2>
          <span className="text-xs text-[color:var(--text-secondary)]">
            Available after purchase and setup
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Globe,
              title: "Your website",
              copy: "Project updates, content and your domain.",
            },
            {
              icon: MessageSquare,
              title: "Lead Hub",
              copy: "A clear place for customer inquiries.",
            },
            {
              icon: CalendarDays,
              title: "Bookings",
              copy: "Appointments and reservations with Care+.",
            },
            {
              icon: Sparkles,
              title: "Insights & Virtue",
              copy: "Business intelligence is being developed.",
            },
          ].map((x) => (
            <Card key={x.title} className="!rounded-2xl !p-5">
              <div className="flex justify-between text-[color:var(--text-secondary)]">
                <x.icon size={20} />
                <LockKeyhole size={14} />
              </div>
              <h3 className="mt-5 text-sm font-medium">{x.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">
                {x.copy}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <p className="text-xs text-[color:var(--text-secondary)]">
        Need a hand choosing?{" "}
        <a className="underline" href="mailto:hello@vigilstudios.co">
          Talk to Vigil
        </a>
      </p>
    </div>
  );
}
export async function ProspectOverview({ name }: { name: string | null }) {
  return (
    <ProspectOverviewContent name={name} purchases={await getMyPurchases()} />
  );
}
