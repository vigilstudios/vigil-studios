import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { EmailText } from "@/components/site/Email";
export const metadata: Metadata = {
  title: "Google Calendar connection privacy | Vigil Studios",
  description:
    "How Vigil uses your optional Google Calendar connection to copy website appointments.",
  alternates: { canonical: "/calendar-privacy" },
};
export default function CalendarPrivacy() {
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container narrow>
          <SectionIntro
            eyebrow="Google Calendar connection privacy"
            title="Your bookings. Your choice to connect."
            lead="An optional calendar connection. Updated 8 November 2026."
          />
          <div className="mt-12 space-y-8 text-[15px] leading-7 text-[color:var(--text-secondary)]">
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Signing in with Google
              </h2>
              <p className="mt-3">
                Google sign-in shares your name, email address and profile image
                with Vigil to create or open your account. It does not connect
                Google Calendar, Gmail or contacts. Read our{" "}
                <Link className="underline" href="/account-privacy">
                  account privacy notice
                </Link>{" "}
                for how we use and protect account information. Calendar access
                below is a separate, optional connection.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                What the connection does
              </h2>
              <p className="mt-3">
                When a business owner or manager connects Google Calendar for a
                website, Vigil creates a separate calendar in the selected
                Google account. Vigil copies service and customer names,
                appointment times, appointment status and unavailable time to
                that calendar. Upcoming appointments and previous copies are
                reconciled when you connect or reconnect. Approval requests are
                tentative and do not reserve time. Customer email addresses,
                phone numbers, private appointment notes and customer
                invitations are not included in these copies.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Google permissions and stored information
              </h2>
              <p className="mt-3">
                Google asks permission to identify the connected email account,
                create secondary calendars and manage events on calendars
                created by this application. Vigil uses the app-created-calendar
                permission. The connection does not import your other Google
                calendars, email or contacts into Vigil. We store your connected
                email address, calendar and event identifiers, connection status
                and an encrypted connection credential in private server
                storage. Credentials are not placed in browser storage or your
                public profile.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                How information is used
              </h2>
              <p className="mt-3">
                The connection uses Google API information to provide the
                calendar-copy feature you choose. We do not sell this Google
                user data, use it for advertising or use it to train general AI
                models. Vigil’s use and transfer of information received from
                Google APIs adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  className="underline"
                >
                  Google API Services User Data Policy
                </a>
                , including its Limited Use requirements. Access by Vigil
                personnel is limited to your authorization, necessary security
                or support work, and applicable legal obligations.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Availability and customer communications
              </h2>
              <p className="mt-3">
                Vigil remains the source of business availability. Changes you
                make in Google Calendar and busy time from other Google
                calendars do not update Vigil. Keep unavailable time blocked in
                Vigil. The copy feature does not send customer invitations or
                configure default Google reminders. Google account settings and
                actions you take directly in Google remain under your control.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Disconnecting and deletion
              </h2>
              <p className="mt-3">
                Disconnect from Bookings setup or{" "}
                <Link href="/dashboard/settings/calendar" className="underline">
                  Calendar connections
                </Link>
                , including after a plan change. Disconnect stops future copies
                and removes the saved credential; a short update already in
                progress must finish first. Existing Google copies remain in
                your Google account. Vigil retains the calendar mapping so a
                later connection can reuse that calendar and reconcile previous
                copies. You can delete the calendar in Google or revoke Vigil’s
                application permission in your Google Account. Revoking
                permission may affect other website calendars you connected
                through the same application. Removal of an authorized business
                membership or deletion of its account removes the corresponding
                saved credentials and mappings from active Vigil storage. For
                account or data deletion requests, contact <EmailText />.
              </p>
            </section>
            <Link
              href="/dashboard/bookings?view=setup"
              className="font-medium text-[color:var(--accent)]"
            >
              Return to Bookings
            </Link>
          </div>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
