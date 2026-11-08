import { createRoot } from "react-dom/client";
import Link from "next/link";
import { AppFrame } from "@/components/vigil/AppFrame";
import { Logo } from "@/components/vigil/Logo";
import { LoginForm } from "@/app/(vigil)/login/LoginForm";
import { ProspectOverviewContent } from "@/components/vigil/ProspectOverview";
import { CustomerAccounts } from "@/components/vigil/CustomerAccounts";
import { prospectNavigation } from "@/lib/vigil/auth/prospect-nav";
import {
  accountFilters,
  type AccountFilter,
} from "@/lib/vigil/accounts/directory";
import { accountRows } from "./stubs";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import "../overview-preview/preview.css";
const params = new URLSearchParams(location.search),
  view =
    params.get("view") ??
    (location.pathname.startsWith("/admin")
      ? "accounts"
      : location.pathname === "/signup"
        ? "signup"
        : location.pathname === "/login"
          ? "login"
          : "prospect");
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
const filter: AccountFilter = accountFilters.includes(
  params.get("status") as AccountFilter,
)
  ? (params.get("status") as AccountFilter)
  : "all";
const rows = accountRows.filter(
  (r) =>
    (filter === "all" ||
      (filter === "purchased" && r.purchase_count > 0) ||
      (filter === "no_purchase" && r.purchase_count === 0) ||
      (filter === "pending" && r.pending_count > 0) ||
      (filter === "active" && r.live_sites > 0)) &&
    (!params.get("q") ||
      `${r.full_name ?? ""} ${r.email}`
        .toLowerCase()
        .includes(params.get("q")!.toLowerCase())),
);
const counts = { all: 4, purchased: 2, no_purchase: 2, pending: 1, active: 1 };
const auth = view === "login" || view === "signup";
const content = auth ? (
  <main className="flex min-h-[calc(100vh-50px)] items-center justify-center px-4 py-8">
    <div className="w-full max-w-md">
      <header className="mb-7 text-center">
        <Logo size="lg" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {view === "signup" ? "Your business starts here" : "Sign in to Vigil"}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          {view === "signup"
            ? "Create your free account. Find your website when you're ready."
            : "Your website, customers and business, in one place."}
        </p>
      </header>
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
        <LoginForm
          next="/dashboard"
          initialError={null}
          signup={view === "signup"}
          googleEnabled
        />
      </section>
      <p className="mt-5 text-center text-xs text-[color:var(--text-secondary)]">
        {view === "signup" ? "Already have an account?" : "New to Vigil?"}{" "}
        <a
          className="underline"
          href={`/?view=${view === "signup" ? "login" : "signup"}`}
        >
          {view === "signup" ? "Sign in" : "Create an account"}
        </a>
      </p>
    </div>
  </main>
) : view === "accounts" ? (
  <CustomerAccounts
    data={{ rows, counts, total: rows.length }}
    filter={filter}
    query={params.get("q") ?? ""}
    page={1}
  />
) : (
  <ProspectOverviewContent name="Avery Parker" />
);
const review = (
  <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3 text-[11px] text-[color:var(--text-secondary)]">
      <strong>Fictional review · no account, email or payment writes</strong>
      <nav className="flex gap-4">
        {["signup", "login", "prospect", "accounts"].map((v) => (
          <Link key={v} href={`/?view=${v}`} className="underline">
            {v}
          </Link>
        ))}
      </nav>
    </div>
    {content}
  </>
);
createRoot(document.getElementById("root")!).render(
  auth ? (
    review
  ) : (
    <AppFrame
      groups={
        view === "accounts"
          ? [
              {
                items: [
                  {
                    href: "/admin/organizations",
                    label: "Customers",
                    icon: "customers",
                  },
                ],
              },
            ]
          : prospectNavigation
      }
      homeHref={view === "accounts" ? "/admin" : "/dashboard"}
      workspace={
        <strong className="text-[13px]">
          {view === "accounts" ? "Vigil Admin" : "Vigil"}
        </strong>
      }
      account={<span className="text-xs">Fictional preview</span>}
      initialCollapsed={false}
    >
      {review}
    </AppFrame>
  ),
);
