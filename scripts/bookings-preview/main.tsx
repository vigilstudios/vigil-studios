import Link from "next/link";
import { AppFrame } from "@/components/vigil/AppFrame";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";
import type { ExpressTemplate } from "@/lib/vigil/express/document";
import { createRoot } from "react-dom/client";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
import BookingsPage from "@/app/(vigil)/dashboard/bookings/page";
import { BasicsStep } from "@/app/(vigil)/dashboard/onboarding/steps/BasicsStep";
import { basicsSchema } from "@/lib/vigil/onboarding/brief";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import "../overview-preview/preview.css";
import "./preview.css";
const params = new URLSearchParams(location.search),
  view =
    params.get("view") ??
    (location.pathname.startsWith("/dashboard") ? "upcoming" : "widget");
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
const previewOnly = async () => false;
const templates: ExpressTemplate[] = [
  {
    slug: "restaurant",
    previewUrl: "/express-preview/restaurant",
    industry: "Restaurant",
    variant: "Signature",
    example: "Marlow & Fen",
    accent: "#4a1728",
    description: "Restaurant contact-first design",
    status: "available",
    nativeBookings: true,
  },
  {
    slug: "salon-spa",
    previewUrl: "/express-preview/salon-spa",
    industry: "Salon & Spa",
    variant: "Quiet",
    example: "Still & Form",
    accent: "#263c35",
    description: "Salon contact-first design",
    status: "available",
    nativeBookings: true,
  },
];
templates.push(
  ...[
    { slug: "home-services", industry: "Home Services", accent: "#eab65b" },
    { slug: "auto-services", industry: "Auto Repair", accent: "#241a27" },
  ].map((t) => ({
    ...t,
    variant: "Signature",
    example: "Example business",
    description: "Optional Care+ bookings",
    status: "available" as const,
    nativeBookings: true,
    previewUrl: `/express-preview/${t.slug}`,
  })),
);
const content =
  view === "catalogue" ? (
    <ExpressCatalogue templates={templates} />
  ) : view === "widget" ? (
    <div className="preview-widget">
      <BookingWidget preview />
    </div>
  ) : view === "onboarding" ? (
    <BasicsStep
      initial={basicsSchema.parse({
        businessName: "Marlow Studio",
        booking: { approach: "vigil", mode: "both" },
      })}
      businessName="Marlow Studio"
      save={previewOnly}
      onSaveState={() => {}}
      onBack={() => {}}
      onNext={() => {}}
    />
  ) : (
    await BookingsPage({
      searchParams: Promise.resolve(
        Object.fromEntries([...params.entries(), ["view", view]]),
      ),
    })
  );
const dashboard = ["upcoming", "requests", "history", "setup"].includes(view);
const review = (
  <>
    <div className="booking-preview-bar">
      <strong>Fictional review · no live changes</strong>
      <nav>
        <Link href="/?view=catalogue">Catalogue</Link>
        <Link href="/?view=widget">Website widget</Link>
        <Link href="/dashboard/bookings?view=upcoming">Bookings</Link>
        <Link href="/?view=requests">Requests</Link>
        <Link href="/?view=setup">Setup</Link>
        <Link href="/?view=onboarding">Onboarding</Link>
        <Link href="/express-preview/restaurant#reserve">Restaurant</Link>
      </nav>
    </div>
    <div className="booking-preview-main">{content}</div>
  </>
);
createRoot(document.getElementById("root")!).render(
  dashboard ? (
    <AppFrame
      homeHref="http://127.0.0.1:4193/"
      initialCollapsed={false}
      workspaceBrand={{ name: "Marlow Studio", iconUrl: null }}
      workspace={<strong>Marlow Studio</strong>}
      account={
        <p style={{ padding: 16, fontSize: 11 }}>
          {params.get("state") === "basic" ? "Basic" : "Care"} plan · Fictional
          preview
        </p>
      }
      groups={[
        {
          items: [
            {
              href: "http://127.0.0.1:4193/",
              label: "Overview",
              icon: "overview",
            },
          ],
        },
        {
          label: "Website",
          items: [
            {
              href: "/dashboard/content",
              label: "Content Hub",
              icon: "website",
              premium: true,
            },
            { href: "/dashboard/files", label: "Files", icon: "files" },
            {
              href: "/dashboard/requests",
              label: "Requests",
              icon: "requests",
              premium: true,
            },
            { href: "/dashboard/domain", label: "Domain", icon: "domain" },
            {
              href: "/dashboard/billing",
              label: "Subscription",
              icon: "billing",
            },
          ],
        },
        {
          label: "Grow",
          items: [
            {
              href: "/dashboard/leads",
              label: "Lead Hub",
              icon: "leads",
            },
            {
              href: "/dashboard/bookings",
              label: "Bookings",
              icon: "bookings",
              premium: true,
              locked: params.get("state") === "basic",
            },
            {
              href: "/dashboard/insights",
              label: "Insights",
              icon: "insights",
              disabled: true,
              badge: "Soon",
            },
            {
              href: "/dashboard/virtue",
              label: "Virtue",
              icon: "virtue",
              disabled: true,
              badge: "Soon",
            },
          ],
        },
        {
          items: [
            {
              href: "/dashboard/settings",
              label: "Settings",
              icon: "settings",
            },
          ],
        },
      ]}
    >
      {review}
    </AppFrame>
  ) : (
    review
  ),
);
