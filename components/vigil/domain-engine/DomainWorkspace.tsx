"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Globe2,
  Search,
  ShieldCheck,
  Clock3,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type {
  ContactSchema,
  RegistrarQuote,
} from "@/lib/vigil/domain-engine/contracts";
import styles from "./domain-workspace.module.css";
import { useRouter } from "next/navigation";
import { EmbeddedTestCheckout } from "./EmbeddedTestCheckout";
import { ManagedDomainConnection } from "./ManagedDomainConnection";

type OrderView = {
  id: string;
  fqdn: string;
  totalMinor: number;
  priceBreakdown?: { registrationMinor: number; serviceFeeMinor: number; taxMinor: number };
  currency: string;
  registrationState: string;
  paymentState: string;
  connectionState: string;
  reason: string | null;
};
type View = {
  client?: { name: string };
  order?: OrderView | null;
  registration?: {
    status?: string;
    expiresAt: string | null;
    autoRenew: boolean;
    contactVerification: string;
  } | null;
  existing?: { fqdn: string; status: string; supported: boolean } | null;
  transferRequested?: boolean;
  registrationId?: string | null;
};
type Quote = RegistrarQuote & {
  id: string;
  contactSchema?: ContactSchema;
  subtotalMinor?: number;
  taxMinor?: number;
  taxPending?: boolean;
  totalMinor?: number;
  serviceFeeMinor?: number;
  policy?: {
    termsUrl: string;
    registrationAgreementUrl: string;
    renewalModel: string;
    taxDescription: string;
  };
};
const money = (minor: number | null | undefined) =>
  minor == null
    ? "Price unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(minor / 100);
const labels: Record<string, string> = {
  awaiting_payment: "Waiting for payment",
  ready: "Ready to register",
  submitting: "Registering your domain",
  pending: "Registration processing",
  unknown: "Checking the registrar response",
  manual_review: "Vigil is reviewing this order",
  registered: "Registered",
  failed: "Registration did not complete",
  ready_for_launch: "Ready for your approved launch",
  live: "Website connected",
  authorized: "Payment authorized",
  paid: "Payment confirmed",
  capture_failed: "Payment needs attention",
  canceled: "Payment authorization released",
  refunded: "Payment refunded",
  refund_pending: "Refund needs reconciliation",
};

export function DomainWorkspace({
  simulation = false,
  live = false,
  discoveryOnly = false,
  websiteId,
  initialHostname = "",
  initialScreen = "choose",
  canManage = true,
  stripeTest = false,
  testRegistrar = "mock",
  testClientName,
  testWebsites = [],
  publishableTestKey = "",
  projectId,
  onExistingSaved,
}: {
  simulation?: boolean;
  live?: boolean;
  discoveryOnly?: boolean;
  websiteId?: string;
  initialHostname?: string;
  initialScreen?: "choose" | "search" | "progress";
  canManage?: boolean;
  stripeTest?: boolean;
  testRegistrar?: "mock" | "openprovider" | "namecom";
  testClientName?: string;
  testWebsites?: { id: string; label: string }[];
  publishableTestKey?: string;
  projectId?: string;
  onExistingSaved?: (domain: { id: string; fqdn: string }) => void;
}) {
  const router = useRouter();
  const endpoint = discoveryOnly ? "/api/domain-engine/discovery" : live
    ? "/api/domain-engine/live"
    : stripeTest
      ? "/api/domain-engine/test"
      : simulation
        ? "/api/domain-engine/demo"
        : "/api/domain-engine";
  const [screen, setScreen] = useState<
    "choose" | "search" | "review" | "progress" | "existing"
  >(initialScreen);
  const [view, setView] = useState<View>({});
  const [input, setInput] = useState(
    initialHostname || (simulation ? "willow-pine-demo" : ""),
  );
  const [results, setResults] = useState<(RegistrarQuote & { taxPending?: boolean })[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState("normal");
  const [terms, setTerms] = useState(false);
  const [transmit, setTransmit] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [dnsConsent, setDnsConsent] = useState(false);
  const [supported, setSupported] = useState(true);
  const [existing, setExisting] = useState(
    simulation ? "existing-willow.com" : "",
  );
  const [checkout, setCheckout] = useState<{
    orderId: string;
    clientSecret: string;
  } | null>(null);
  const orderId = useRef<string | null>(null);
  const intent = useRef<string | null>(null);
  const sequence = useRef(0);
  const addressSequence = useRef(0);
  const actionEpoch = useRef(0);
  const [contact, setContact] = useState({
    additional: {} as Record<string, string>,
    firstName: simulation ? "Alex" : "",
    lastName: simulation ? "Example" : "",
    organization: simulation ? "Willow & Pine (test)" : "",
    email: simulation ? "owner@example.test" : "",
    phone: simulation ? "+12125550100" : "",
    address: {
      line1: simulation ? "1 Example Street" : "",
      line2: "",
      city: simulation ? "Example City" : "",
      region: simulation ? "NY" : "",
      postalCode: simulation ? "10001" : "",
      country: "US",
    },
  });
  async function call(payload: Record<string, unknown>) {
    actionEpoch.current += 1;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ...(projectId && !live ? { projectId } : {}),
          ...(live ? { websiteId } : {}),
          ...((stripeTest || live) && orderId.current
            ? { orderId: orderId.current }
            : {}),
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok)
        throw new Error(
          data.error || "The domain request could not be completed.",
        );
      if (payload.action === "existing" && data.existing?.id)
        onExistingSaved?.({ id: data.existing.id, fqdn: data.existing.fqdn });
      if (payload.action === "support")
        setNotice(
          "Your request is saved. Vigil will review it; no registrar change or additional charge was submitted.",
        );
      if (data.order?.id) orderId.current = data.order.id;
      setView((current) => ({ ...current, ...data }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (discoveryOnly || (live && !canManage)) return;
    const controller = new AbortController();
    const restoreEpoch = actionEpoch.current;
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        ...(live ? { websiteId } : {}),
        ...((stripeTest || live) &&
        new URLSearchParams(window.location.search).get("order")
          ? {
              orderId: new URLSearchParams(window.location.search).get("order"),
            }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (controller.signal.aborted || actionEpoch.current !== restoreEpoch) return;
        if (!response.ok || !data.ok)
          throw new Error(
            data.error || "The test workspace could not be restored.",
          );
        if (data.order?.id) {
          orderId.current = data.order.id;
          setScreen((current) =>
            current === "choose" || live ? "progress" : current,
          );
        }
        setView(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted && actionEpoch.current === restoreEpoch)
          setError(
            error instanceof Error
              ? error.message
              : "The test workspace could not be restored.",
          );
      });
    return () => controller.abort();
  }, [endpoint, stripeTest, live, websiteId, canManage, discoveryOnly]);
  const pollingOrderId = view.order?.id;
  useEffect(() => {
    if (!live || !canManage || screen !== "progress" || !pollingOrderId) return;
    const abort = new AbortController();
    let inFlight = false;
    const timer = window.setInterval(async () => {
      if (
        inFlight ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
      )
        return;
      inFlight = true;
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "status",
            websiteId,
            orderId: pollingOrderId,
          }),
          cache: "no-store",
          signal: abort.signal,
        });
        const data = await r.json();
        if (r.ok && data.ok && !abort.signal.aborted)
          setView((current) => ({ ...current, ...data }));
      } catch {
        /* Resume polling when the page is visible and online. */
      } finally {
        inFlight = false;
      }
    }, 15000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [live, canManage, screen, pollingOrderId, endpoint, websiteId]);
  async function search() {
    const current = ++sequence.current;
    const data = await call({ action: "search", input });
    if (data && current === sequence.current) setResults(data.results);
  }
  async function select(result: RegistrarQuote) {
    if (!simulation && !stripeTest && !live) {
      setQuote({ ...result, id: "discovery-only" });
      setScreen("review");
      return;
    }
    const data = await call({ action: "quote", fqdn: result.fqdn });
    if (data) {
      setQuote(data.quote);
      setTerms(false);
      setTransmit(false);
      intent.current = crypto.randomUUID();
      setScreen("review");
    }
  }
  async function purchase(event: React.FormEvent) {
    event.preventDefault();
    if (!quote || discoveryOnly || (live && quote.taxPending)) return;
    const data = await call({
      action: "purchase",
      approval: {
        quoteId: quote.id,
        intentId: intent.current,
        totalMinor: quote.registration?.amountMinor,
        currency: "usd",
        contact,
        autoRenew,
        acceptTerms: terms,
        acceptContactTransmission: transmit,
      },
    });
    if (data) {
      if ((stripeTest || live) && data.clientSecret) {
        orderId.current = data.orderId;
        const location = new URL(window.location.href);
        location.searchParams.set("order", data.orderId);
        window.history.replaceState(null, "", location);
        setCheckout({ orderId: data.orderId, clientSecret: data.clientSecret });
      } else setScreen("progress");
    }
  }
  async function calculateFinalPrice() {
    if (!quote || !live || discoveryOnly) return;
    const current = addressSequence.current;
    const data = await call({ action: "tax_quote", quoteId: quote.id, address: contact.address });
    if (data && current === addressSequence.current) {
      setQuote({ ...quote, ...data.quote });
      setTerms(false);
      intent.current = crypto.randomUUID();
    }
  }
  function changeAddress(key: keyof typeof contact.address, value: string) {
    addressSequence.current++;
    setContact(current => ({ ...current, address: { ...current.address, [key]: value } }));
    if (live && quote) {
      setQuote({ ...quote, taxPending: true });
      setTerms(false);
    }
  }
  function field(
    key: "firstName" | "lastName" | "organization" | "email" | "phone",
    label: string,
    type = "text",
  ) {
    return (
      <label className={styles.field}>
        {label}
        <input
          required={key !== "organization"}
          maxLength={key === "organization" ? 200 : 254}
          type={type}
          value={contact[key]}
          onChange={(event) =>
            setContact({ ...contact, [key]: event.target.value })
          }
        />
      </label>
    );
  }
  const registration = view.registration;
  const order = view.order;
  const assetStateLabel =
    registration?.status === "expired"
      ? "Domain expired"
      : registration?.status === "contact_hold"
        ? "Verification required"
        : registration?.status === "transfer_pending" ||
            registration?.status === "transferred"
          ? "Transfer in progress"
          : registration?.status === "released"
            ? "Domain released"
            : null;

  if (live && !canManage && !discoveryOnly)
    return (
      <p role="status">
        The customer owner must sign in directly to authorize domain purchases
        and manage registrar access.
      </p>
    );

  return (
    <section className={styles.workspace} aria-label="Domain and hosting setup">
      {simulation ? (
        <div className={styles.simulation}>
          <span>
            <ShieldCheck size={17} /> TEST WORKSPACE ·{" "}
            {testClientName ?? view.client?.name ?? "Willow & Pine"}
          </span>
          <p>
            {stripeTest
              ? `Isolated Stripe test checkout with ${testRegistrar === "namecom" ? "the Name.com sandbox" : testRegistrar === "openprovider" ? "the Openprovider sandbox" : "a mock registrar"}. Use fictional contact information and test cards only. No real domain or production DNS changes.`
              : "Fictional client, simulated prices and payments. No real domain is purchased and no DNS is changed. Test progress is kept for one hour."}
          </p>
        </div>
      ) : null}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>YOUR ADDRESS ON THE INTERNET</div>
          <h2>A home for your website.</h2>
          <p>
            Find a new domain or connect the one you already own. Vigil handles
            the technical steps.
          </p>
        </div>
        <Globe2 className={styles.orb} size={46} strokeWidth={1} />
      </div>
      <nav className={styles.tabs} aria-label="Domain setup steps">
        {(
          [
            ["choose", "Choose a path"],
            ["search", "Find a domain"],
            ["progress", "Your domain"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            disabled={busy}
            aria-current={screen === key ? "step" : undefined}
            onClick={() => setScreen(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {notice ? (
        <p role="status" className={styles.note}>
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div aria-live="polite" className={styles.sr}>
        {busy ? "Working…" : ""}
      </div>
      {screen === "choose" ? (
        <div className={styles.choices}>
          <button
            className={styles.choice}
            disabled={busy}
            aria-label="Find a new domain"
            onClick={() => setScreen("search")}
          >
            <span className={styles.icon}>
              <Search size={22} />
            </span>
            <h3>Find a new domain</h3>
            <p>
              Choose your name, review the price and keep everything together in
              Vigil.
            </p>
            <span className={styles.link}>
              Find your name <ArrowRight size={16} />
            </span>
          </button>
          <button
            className={styles.choice}
            disabled={busy}
            aria-label="Use a domain I own"
            onClick={() =>
              live
                ? router.push("/dashboard/domain?flow=own")
                : setScreen("existing")
            }
          >
            <span className={styles.icon}>
              <Globe2 size={22} />
            </span>
            <h3>Use a domain I own</h3>
            <p>
              Keep your domain where it is. Approve the connection with your DNS
              provider.
            </p>
            <span className={styles.link}>
              Connect your domain <ArrowRight size={16} />
            </span>
          </button>
          <p className={styles.note}>
            <Clock3 size={16} /> Not ready yet? Your website preview remains
            available. You can return here before launch.
          </p>
        </div>
      ) : null}
      {screen === "search" ? (
        <div className={styles.panel}>
          <h3>Find a name that feels like you.</h3>
          <p>
            Enter your business name or an exact domain. Availability can change
            until registration completes.
          </p>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <label className={styles.sr} htmlFor="domain-search">
              Business name or domain
            </label>
            <input
              id="domain-search"
              value={input}
              maxLength={253}
              onChange={(event) => setInput(event.target.value)}
              placeholder="yourbusiness.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button className={styles.primary} disabled={busy || (!canManage && !discoveryOnly)}>
              <Search size={17} />
              {busy ? "Searching…" : "Search domains"}
            </button>
          </form>
          {!simulation && !live ? (
            <p className={styles.note}>
              Availability and prices are from Vercel. Purchases remain disabled
              while client ownership and service terms are approved.
            </p>
          ) : null}
          <div className={styles.results}>
            {results.map((result) => (
              <div className={styles.result} key={result.fqdn}>
                <div>
                  <strong>{result.fqdn}</strong>
                  <p>
                    {result.availability === "available"
                      ? result.premium
                        ? "Premium domain"
                        : "Available now"
                      : result.availability === "unsupported"
                        ? live ? "Not available for this service" : "Not included in this test fixture"
                        : "Unavailable or unconfirmed"}
                  </p>
                </div>
                <div className={styles.price}>
                  {result.registration ? (
                    <>
                      <strong>
                        {money(result.registration.amountMinor)}
                        <small> / first year{result.taxPending || discoveryOnly ? " before tax" : ""}</small>
                      </strong>
                      <p>
                        Renews at approximately{" "}
                        {money(result.renewal?.amountMinor)}/year
                      </p>
                    </>
                  ) : null}
                </div>
                <button
                  className={styles.secondary}
                  disabled={
                    busy || result.availability !== "available" || (!canManage && !discoveryOnly)
                  }
                  onClick={() => void select(result)}
                >
                  Review name <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {checkout ? (
        <div className={styles.panel}>
          <h3>{live ? "Approve your payment" : "Approve your test payment"}</h3>
          <EmbeddedTestCheckout
            live={live}
            clientSecret={checkout.clientSecret}
            publishableKey={publishableTestKey}
            onComplete={() => {
              void call({
                action: "reconcile",
                orderId: checkout.orderId,
              }).then((data) => {
                if (data) {
                  setCheckout(null);
                  setScreen("progress");
                }
              });
            }}
          />
        </div>
      ) : null}
      {screen === "review" && quote && !checkout ? (
        <div className={styles.review}>
          <form className={styles.panel} onSubmit={purchase}>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setScreen("search")}
            >
              ← Choose another name
            </button>
            <h3>Make it yours.</h3>
            {discoveryOnly || (!simulation && !live) ? (
              <div className={styles.notice}>
                <ShieldCheck size={20} />
                <div>
                  <strong>{discoveryOnly ? "Search now. Purchasing is being prepared." : "Registration is awaiting approval."}</strong>
                  <p>
                    This name is available to search, but it is not reserved.
                    The price shown includes Vigil’s service fee and is before tax.
                    Your final total will be shown before you approve payment.
                    You can keep using your website preview while purchasing is prepared.
                    You will not need a separate Vercel account.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p>
                  {live && !discoveryOnly
                    ? "Confirm the legal owner and approve the exact name, one-year term and final price. Enter accurate registrant details. A verification email will be sent by the registrar."
                    : "Confirm the legal registrant and approve the exact name, term and test price. Use fictional contact details in this workspace."}
                </p>
                <p>
                  If you enter an organization, it will be recorded as the legal
                  domain holder. Use the legal name of your business, or leave this
                  blank when registering as an individual.
                </p>
                <div className={styles.formGrid}>
                  {field("firstName", "First name")}
                  {field("lastName", "Last name")}
                  {field("organization", "Organization (optional)")}
                  {field("email", "Registrant email", "email")}
                  {field("phone", "Phone including country code", "tel")}
                  {(
                    [
                      ["line1", "Street address"],
                      ["city", "City"],
                      ["region", "State / region"],
                      ["postalCode", "Postal code"],
                      ["country", "Country code"],
                    ] as const
                  ).map(([key, label]) => (
                    <label className={styles.field} key={key}>
                      {label}
                      <input
                        required
                        readOnly={live && key === "country"}
                        maxLength={key === "country" ? 2 : 200}
                        value={contact.address[key]}
                        onChange={(event) => changeAddress(key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                {quote.contactSchema?.additional.length ? (
                  <div className={styles.formGrid}>
                    {quote.contactSchema.additional.map((extra) => (
                      <label className={styles.field} key={extra.key}>
                        {extra.label}
                        <input
                          required={extra.required}
                          maxLength={200}
                          value={contact.additional[extra.key] ?? ""}
                          onChange={(event) =>
                            setContact({
                              ...contact,
                              additional: {
                                ...contact.additional,
                                [extra.key]: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : null}
                {live && quote.taxPending ? <div className={styles.notice}>
                  <div><p>Confirm your US address, then calculate tax to see the final total. Your address is shared with Stripe for tax calculation.</p>
                    <button type="button" className={styles.primary} disabled={busy} onClick={() => void calculateFinalPrice()}>{busy ? "Calculating…" : "Calculate final price"}</button>
                  </div>
                </div> : null}
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    disabled={live || testRegistrar === "namecom"}
                    onChange={(event) => setAutoRenew(event.target.checked)}
                  />
                  <span>
                    {live
                      ? `Renewal is manual. Vigil will remind you before expiry; a renewal requires a separate request and approval. The current registrar estimate is ${money(quote.renewal?.amountMinor)} per year.`
                      : testRegistrar === "namecom"
                        ? `Automatic renewal stays off during this sandbox test. The renewal estimate is ${money(quote.renewal?.amountMinor)} per year.`
                        : `Enable annual renewal for this test domain. The renewal estimate is ${money(quote.renewal?.amountMinor)} per year; future changes require advance notice.`}
                  </span>
                </label>
                <label className={styles.check}>
                  <input
                    required
                    type="checkbox"
                    checked={transmit}
                    onChange={(event) => setTransmit(event.target.checked)}
                  />
                  <span>
                    I confirm these registrant details and approve sending them
                    to the registrar.
                  </span>
                </label>
                <label className={styles.check}>
                  <input
                    required
                    type="checkbox"
                    checked={terms}
                    disabled={live && quote.taxPending}
                    onChange={(event) => setTerms(event.target.checked)}
                  />
                  <span>
                    I approve <b>{quote.fqdn}</b> for one year at{" "}
                    <b>{quote.taxPending ? "the final price calculated above" : money(quote.registration?.amountMinor)}</b>, the renewal
                    choice above, and the{" "}
                    <a
                      href={
                        live
                          ? quote.policy?.termsUrl
                          : "/domain-engine-demo/terms"
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {live ? "service terms" : "test service terms"}{" "}
                      <ExternalLink size={12} />
                    </a>
                    .{" "}
                    {live && quote.policy ? (
                      <>
                        I also accept the{" "}
                        <a
                          href={quote.policy.registrationAgreementUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          registrar registration agreement
                        </a>
                        .{" "}
                      </>
                    ) : null}
                    Domain registration is separate from website hosting.
                  </span>
                </label>
                <button
                  className={styles.primary}
                  disabled={busy || !terms || !transmit || !canManage || (live && quote.taxPending)}
                  type="submit"
                >
                  {busy
                    ? live
                      ? "Preparing secure checkout…"
                      : "Processing test order…"
                    : live && quote.taxPending ? "Calculate the final price first" : live
                      ? `Authorize ${money(quote.registration?.amountMinor)} & register`
                      : `Authorize ${money(quote.registration?.amountMinor)} test payment & register`}
                </button>
                <p className={styles.note}>
                  {live
                    ? "Continue to secure Stripe checkout. Payment is authorized first and captured after registration is confirmed. Vigil never receives your card number."
                    : stripeTest
                      ? "Continue to embedded Stripe test checkout. Use test card details only; Vigil never receives card numbers."
                      : "No card details are collected. This demonstration simulates an authorization and capture; it cannot charge a card."}
                </p>
              </>
            )}
          </form>
          <aside className={styles.summary}>
            <span className={styles.eyebrow}>YOUR SELECTED DOMAIN</span>
            <h3>{quote.fqdn}</h3>
            <dl>
              <div>
                <dt>Registration term</dt>
                <dd>1 year</dd>
              </div>
              <div>
                <dt>Registration</dt>
                <dd>
                  {money(
                    quote.subtotalMinor != null
                      ? quote.subtotalMinor - (quote.serviceFeeMinor ?? 0)
                      : quote.registration?.amountMinor,
                  )}
                </dd>
              </div>
              <div>
                <dt>Vigil service fee {simulation ? "(test)" : ""}</dt>
                <dd>
                  {quote.serviceFeeMinor != null
                    ? money(quote.serviceFeeMinor)
                    : simulation
                      ? "$0.00"
                      : "Not quoted"}
                </dd>
              </div>
              <div>
                <dt>Tax {simulation ? "(test)" : ""}</dt>
                <dd>
                  {quote.taxPending ? "Calculated after your address" : quote.taxMinor != null
                    ? money(quote.taxMinor)
                    : simulation
                      ? "$0.00"
                      : "Not quoted"}
                </dd>
              </div>
              <div>
                <dt>
                  {quote.taxPending || discoveryOnly ? "Total before tax" : live
                    ? "Total today"
                    : simulation
                      ? "Total today (test)"
                      : "Registrar price before tax"}
                </dt>
                <dd>{money(quote.registration?.amountMinor)}</dd>
              </div>
            </dl>
            <p>
              <ShieldCheck size={16} /> Your name stays visible until you
              approve. A search result is not a reservation.
            </p>
          </aside>
        </div>
      ) : null}
      {screen === "progress" ? (
        <div className={styles.panel}>
          {!order ? (
            <>
              <h3>Your domain will appear here.</h3>
              <p>Choose a name to start, or keep using your website preview.</p>
              <button
                className={styles.primary}
                onClick={() => setScreen("search")}
              >
                Find a domain <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div className={styles.statusHead}>
                <div>
                  <span className={styles.eyebrow}>
                    DOMAIN SETUP{" "}
                    {stripeTest
                      ? "· TEST MODE"
                      : simulation
                        ? "· SIMULATED"
                        : ""}
                  </span>
                  <h3>{order.fqdn}</h3>
                </div>
                <span className={styles.badge}>
                  {assetStateLabel ??
                    labels[
                      order.connectionState === "live"
                        ? "live"
                        : order.registrationState
                    ] ??
                    order.registrationState}
                </span>
              </div>
              <ol className={styles.timeline}>
                {[
                  {
                    label: labels[order.paymentState] ?? order.paymentState,
                    done: order.paymentState === "paid",
                  },
                  {
                    label:
                      assetStateLabel ??
                      labels[order.registrationState] ??
                      order.registrationState,
                    done:
                      order.registrationState === "registered" &&
                      !assetStateLabel,
                  },
                  {
                    label:
                      registration?.contactVerification === "verified"
                        ? "Registrant email verified"
                        : "Verify the registrant email",
                    done: registration?.contactVerification === "verified",
                  },
                  {
                    label:
                      order.connectionState === "live" && !assetStateLabel
                        ? "Website connected securely"
                        : assetStateLabel
                          ? "Resolve the domain status before connecting"
                          : "Waiting for your approved Deploy Live",
                    done: order.connectionState === "live" && !assetStateLabel,
                  },
                ].map((step, index) => (
                  <li key={index} data-done={step.done}>
                    <span>{step.done ? <Check size={16} /> : index + 1}</span>
                    {step.label}
                  </li>
                ))}
              </ol>
              {(stripeTest || live) &&
              order.registrationState === "awaiting_payment" ? (
                <button
                  className={styles.primary}
                  disabled={busy}
                  onClick={async () => {
                    const data = await call({
                      action: "resume_checkout",
                      orderId: order.id,
                    });
                    if (data?.clientSecret) {
                      setCheckout({
                        orderId: order.id,
                        clientSecret: data.clientSecret,
                      });
                      setScreen("review");
                    }
                  }}
                >
                  {live ? "Resume checkout" : "Resume test checkout"}
                </button>
              ) : null}
              {order.reason ? (
                <p className={styles.notice}>{reasonText(order.reason)}</p>
              ) : null}
              {registration &&
              registration.contactVerification !== "verified" &&
              order.reason !== "contact_required" ? (
                <p className={styles.notice}>
                  {reasonText("contact_required")}
                </p>
              ) : null}
              {registration?.status === "expired" ? (
                <p className={styles.notice}>
                  This domain has expired. Contact Vigil to review renewal
                  before reconnecting the website.
                </p>
              ) : null}
              {registration ? (
                <div className={styles.manage}>
                  <h4>Manage your domain</h4>
                  <dl>
                    <div>
                      <dt>Expires {simulation ? "(test)" : ""}</dt>
                      <dd>
                        {registration.expiresAt
                          ? new Date(
                              registration.expiresAt,
                            ).toLocaleDateString()
                          : "Checking"}
                      </dd>
                    </div>
                    <div>
                      <dt>Renewal preference</dt>
                      <dd>
                        {registration.autoRenew
                          ? live
                            ? "Enabled at registrar — needs review"
                            : "Automatic renewal approved"
                          : "Manual renewal"}
                      </dd>
                    </div>
                    {order.priceBreakdown ? <>
                      <div><dt>Registration</dt><dd>{money(order.priceBreakdown.registrationMinor)}</dd></div>
                      <div><dt>Vigil service fee</dt><dd>{money(order.priceBreakdown.serviceFeeMinor)}</dd></div>
                      <div><dt>Sales tax</dt><dd>{money(order.priceBreakdown.taxMinor)}</dd></div>
                    </> : null}
                    <div>
                      <dt>Receipt {simulation ? "(test)" : ""}</dt>
                      <dd>
                        {money(order.totalMinor)} · {labels[order.paymentState]}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}
              {(live || (stripeTest && testRegistrar === "namecom")) &&
              view.registrationId &&
              order.paymentState === "paid" ? (
                <ManagedDomainConnection
                  key={view.registrationId}
                  registrationId={view.registrationId}
                  live={live}
                  contactVerified={
                    registration?.contactVerification === "verified"
                  }
                  websites={testWebsites}
                />
              ) : null}
              {simulation && !stripeTest ? (
                <div className={styles.actions}>
                  {registration?.contactVerification === "pending" ? (
                    <button
                      className={styles.primary}
                      disabled={busy}
                      onClick={() => void call({ action: "verify_contact" })}
                    >
                      Simulate email verification
                    </button>
                  ) : null}
                  {order.registrationState === "registered" &&
                  order.connectionState !== "live" ? (
                    <button
                      className={styles.primary}
                      disabled={
                        busy ||
                        registration?.contactVerification !== "verified" ||
                        order.paymentState !== "paid"
                      }
                      onClick={() => void call({ action: "launch" })}
                    >
                      Simulate approved Deploy Live
                    </button>
                  ) : null}
                  <button
                    className={styles.secondary}
                    disabled={busy}
                    onClick={() => void call({ action: "reconcile" })}
                  >
                    <RefreshCw size={15} /> Recheck test status
                  </button>
                  {registration ? (
                    <>
                      <button
                        className={styles.secondary}
                        disabled={busy}
                        onClick={() =>
                          void call({
                            action: "renewal",
                            enabled: !registration.autoRenew,
                            consent: true,
                          })
                        }
                      >
                        {registration.autoRenew
                          ? "Approve manual renewal"
                          : "Approve automatic renewal"}
                      </button>
                      <button
                        className={styles.secondary}
                        disabled={busy || view.transferRequested}
                        onClick={() => void call({ action: "transfer" })}
                      >
                        {view.transferRequested
                          ? "Transfer assistance requested"
                          : "Request domain release / transfer"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
              {live && order.connectionState === "live" && !assetStateLabel ? (
                <a
                  className={styles.primary}
                  href={`https://www.${order.fqdn}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit your website <ExternalLink size={14} />
                </a>
              ) : null}
              {live && view.registrationId ? (
                <div className={styles.actions}>
                  {(
                    [
                      ["renewal", "Request renewal"],
                      ["contact_verification", "Get verification help"],
                      ["payment_reconciliation", "Get payment help"],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() =>
                        void call({ action: "support", kind }).then(
                          (result) => {
                            if (result)
                              setNotice(
                                "Your request is saved. Vigil will review it; no registrar change or additional charge was submitted.",
                              );
                          },
                        )
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              {!simulation && view.registrationId ? (
                <button
                  className={styles.secondary}
                  disabled={busy || view.transferRequested || !canManage}
                  onClick={() =>
                    void call({
                      ...(live
                        ? { action: "support", kind: "release" }
                        : {
                            action: "transfer",
                            registrationId: view.registrationId,
                          }),
                    })
                  }
                >
                  {view.transferRequested
                    ? "Transfer assistance requested"
                    : "Request domain release / transfer"}
                </button>
              ) : null}
              {stripeTest || live ? (
                <button
                  className={styles.secondary}
                  disabled={busy}
                  onClick={() => void call({ action: "reconcile" })}
                >
                  {live
                    ? "Recheck domain and payment status"
                    : "Recheck authoritative test status"}
                </button>
              ) : null}
              <p className={styles.note}>
                Your website preview remains available throughout setup.
                Registration does not publish the site.
              </p>
            </>
          )}
        </div>
      ) : null}
      {screen === "existing" ? (
        <div className={styles.panel}>
          <h3>Keep your domain. Connect your website.</h3>
          <p>
            We identify where your DNS is managed. Supported providers ask you
            to sign in and approve the exact website changes; Vigil never asks
            for your password.
          </p>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setDnsConsent(false);
              void call({ action: "existing", fqdn: existing, supported });
            }}
          >
            <label className={styles.sr} htmlFor="existing-domain">
              Your existing domain
            </label>
            <input
              id="existing-domain"
              value={existing}
              onChange={(event) => setExisting(event.target.value)}
              placeholder="yourbusiness.com"
              required
            />
            <button
              className={styles.primary}
              disabled={busy || !canManage || stripeTest}
            >
              Check connection <ArrowRight size={16} />
            </button>
          </form>
          {simulation ? (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={supported}
                onChange={(event) => setSupported(event.target.checked)}
              />
              Simulate a provider that supports authorized setup
            </label>
          ) : null}
          {view.existing ? (
            <div className={styles.manage}>
              <h4>{view.existing.fqdn}</h4>
              {view.existing.status === "assistance_required" ? (
                <p>
                  Assistance required. Your request is visible to Vigil; we will
                  arrange supported delegated access. Please do not send a
                  password.
                </p>
              ) : view.existing.status === "ready_for_launch" ? (
                <p>
                  <Check size={17} /> Connection authorized and ready for the
                  approved launch. Existing email records are preserved.
                </p>
              ) : (
                <>
                  <p>
                    {simulation
                      ? "Test DNS provider found. Review these simulated website-only changes:"
                      : "Your provider must approve a supported connection before DNS can be changed."}
                  </p>
                  {simulation ? (
                    <>
                      <ul className={styles.records}>
                        <li>A · @ → 192.0.2.1 (test-only address)</li>
                        <li>CNAME · www → website.example.test</li>
                        <li>TXT · _vigil → per-client ownership proof</li>
                      </ul>
                      <label className={styles.check}>
                        <input
                          type="checkbox"
                          checked={dnsConsent}
                          onChange={(event) =>
                            setDnsConsent(event.target.checked)
                          }
                        />
                        Approve only these simulated website records. Preserve
                        email, DNSSEC and unrelated records.
                      </label>
                      <button
                        className={styles.primary}
                        disabled={busy || !dnsConsent}
                        onClick={() =>
                          void call({ action: "authorize_dns", consent: true })
                        }
                      >
                        Simulate provider sign-in & approval
                      </button>
                    </>
                  ) : (
                    <p>
                      Vigil will assist until your DNS provider has approved our
                      integration. Your existing website remains in place.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      {simulation && !stripeTest ? (
        <details className={styles.testControls}>
          <summary>Test recovery scenarios</summary>
          <label className={styles.field}>
            Scenario
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
            >
              <option value="normal">Successful registration</option>
              <option value="pending">Registrar still processing</option>
              <option value="unknown">Registrar response lost</option>
              <option value="capture_failed">
                Registration succeeds, capture fails
              </option>
              <option value="price_changed">
                Price changed before purchase
              </option>
              <option value="sold">Domain sold before purchase</option>
            </select>
          </label>
          <button
            className={styles.secondary}
            disabled={busy}
            onClick={async () => {
              const data = await call({ action: "reset", scenario });
              if (data) {
                setResults([]);
                setQuote(null);
                setScreen("choose");
              }
            }}
          >
            Start a fresh fictional client test
          </button>
        </details>
      ) : null}
    </section>
  );
}
function reasonText(reason: string) {
  return (
    (
      {
        payment_failed:
          "Payment was not completed. Recheck the order status before choosing a fresh quote.",
        quote_expired:
          "The quote expired. Review a fresh quote before approving another payment.",
        price_changed:
          "The price changed before registration. The test authorization was released; approve a fresh quote to continue.",
        unavailable:
          "The name became unavailable. The test authorization was released.",
        provider_unknown:
          "The registrar response is uncertain. Vigil will reconcile the existing order before considering another purchase.",
        capture_failed:
          "The domain was registered, but payment capture needs attention. The registration is preserved and will not be repeated.",
        contact_required:
          "Action required: verify the registrant email. This keeps the domain active.",
        refund_pending:
          "The refund needs reconciliation. No second registration will be attempted.",
      } as Record<string, string>
    )[reason] ?? "Vigil is checking the next step."
  );
}
