import Link from "next/link";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";
import type { ExpressTemplate } from "@/lib/vigil/express/document";
import { createRoot } from "react-dom/client";
import { BookingWidget } from "@/design-engine/forms/WebsiteBookingHost";
import BookingsPage from "@/app/(vigil)/dashboard/leads/bookings/page";
import { BasicsStep } from "@/app/(vigil)/dashboard/onboarding/steps/BasicsStep";
import { basicsSchema } from "@/lib/vigil/onboarding/brief";
import "@/app/globals.css";
import "@/components/vigil/vigil.css";
import "./preview.css";
const params = new URLSearchParams(location.search),
  view = params.get("view") ?? "widget";
document.documentElement.dataset.theme =
  params.get("theme") === "dark" ? "dark" : "light";
const previewOnly = async () => false;
const templates: ExpressTemplate[] = [
  {
    slug: "restaurant",
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
    industry: "Salon & Spa",
    variant: "Quiet",
    example: "Still & Form",
    accent: "#263c35",
    description: "Salon contact-first design",
    status: "available",
    nativeBookings: true,
  },
];
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
    await BookingsPage({ searchParams: Promise.resolve({ view }) })
  );
createRoot(document.getElementById("root")!).render(
  <>
    <div className="booking-preview-bar">
      <strong>Fictional review · no live changes</strong>
      <nav>
        <Link href="/?view=catalogue">Catalogue</Link>
        <Link href="/?view=widget">Website widget</Link>
        <Link href="/?view=upcoming">Lead Hub</Link>
        <Link href="/?view=requests">Requests</Link>
        <Link href="/?view=setup">Setup</Link>
        <Link href="/?view=onboarding">Onboarding</Link>
        <Link href="/express-templates/restaurant.html#reserve">
          Restaurant
        </Link>
      </nav>
    </div>
    <main className="booking-preview-main">{content}</main>
  </>,
);
