import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
export const metadata: Metadata = {
  title: "Vigil account privacy",
  description:
    "How Vigil uses account information and optional Google sign-in.",
  alternates: { canonical: "/account-privacy" },
};
export default function AccountPrivacy() {
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container narrow>
          <SectionIntro
            eyebrow="Account privacy"
            title="Your account. Your business."
            lead="Account registration, purchases and optional Google sign-in. Effective 8 November 2026."
          />
          <div className="mt-12 space-y-8 text-[15px] leading-7 text-[color:var(--text-secondary)]">
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Information used for your account
              </h2>
              <p className="mt-3">
                Vigil uses your name, email address, sign-in identity and
                account profile to authenticate you, provide your dashboard,
                support your account and connect purchases to you. Registering
                does not purchase a website or activate paid business services.
                Purchases, payment status and business memberships are recorded
                separately.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Optional Google sign-in
              </h2>
              <p className="mt-3">
                If you choose Google sign-in, Google shares your basic identity,
                including your name, email address and profile image when
                available. Vigil uses this information to create or sign in to
                your account. This permission does not connect Gmail, Google
                Calendar, contacts or other business services. Optional{" "}
                <Link className="underline" href="/calendar-privacy">
                  Calendar connections
                </Link>{" "}
                have a separate permission flow.
              </p>
              <p className="mt-3">
                We do not sell Google sign-in data, use it for advertising or
                use it to train general AI models. Vigil&apos;s use and transfer
                of information received from Google APIs adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  className="underline"
                  rel="noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , including its Limited Use requirements.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Storage and access
              </h2>
              <p className="mt-3">
                Account authentication and records are stored through Supabase,
                and Vigil&apos;s application runs on Vercel. Passwords are
                processed by the authentication service; Vigil staff do not
                receive your plaintext password. Signed-in sessions use cookies.
                You can choose whether to keep your session across browser
                restarts; your browser controls password saving.
              </p>
              <p className="mt-3">
                Authorized Vigil staff can view customer accounts, including
                accounts without a purchase, to administer the service and offer
                assistance. Business data is limited by business memberships and
                roles. Your profile and business access are not made public by
                registration.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                Your choices and questions
              </h2>
              <p className="mt-3">
                You can update your account name, sign out and manage your
                Google app permissions in your Google account. Removing Google
                permission does not cancel purchases or remove business records.
                Contact{" "}
                <a href="mailto:hello@vigilstudios.co" className="underline">
                  hello@vigilstudios.co
                </a>{" "}
                to request help with account access, information or deletion. We
                will explain what can be removed and any purchase records that
                must remain.
              </p>
            </section>
          </div>
        </Container>
      </Section>
      <Footer />
    </>
  );
}
