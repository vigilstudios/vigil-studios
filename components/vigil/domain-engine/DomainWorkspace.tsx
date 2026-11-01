"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Link2,
  CircleHelp,
  UserRound,
  MapPin,
  Mail,
  FileText,
  CreditCard,
  Eye,
  LockKeyhole,
  Pencil,
  CalendarDays,
  ReceiptText,
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
import { DomainCelebration } from "@/components/vigil/DomainCelebration";
import {
  DomainIntro,
  DomainReadyHandoff,
  DomainSectionHeading,
  DomainSetupSteps,
} from "./DomainSetupUI";
import { customerDomainProgress } from "@/lib/vigil/domain-engine/customer-progress";

type OrderView = {
  id: string;
  fqdn: string;
  totalMinor: number;
  priceBreakdown?: {
    registrationMinor: number;
    serviceFeeMinor: number;
    taxMinor: number;
  };
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
  launchHandoff?: { automaticConnection: boolean; staffNotified: boolean };
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
    automaticPurchaseRegions?: string[] | null;
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
  ready_for_launch: "Ready for Vigil’s website launch",
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
  const endpoint = discoveryOnly
    ? "/api/domain-engine/discovery"
    : live
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
  const [restoring, setRestoring] = useState(
    !discoveryOnly && (!live || canManage),
  );
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [input, setInput] = useState(
    initialHostname || (simulation ? "willow-pine-demo" : ""),
  );
  const [results, setResults] = useState<
    (RegistrarQuote & { taxPending?: boolean })[]
  >([]);
  const [reviewSection, setReviewSection] = useState<"details" | "confirm">(
    "details",
  );
  const [searched, setSearched] = useState(false);
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
  const workspaceRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
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
        if (controller.signal.aborted || actionEpoch.current !== restoreEpoch)
          return;
        if (!response.ok || !data.ok)
          throw new Error(
            data.error || "Your saved domain setup could not be loaded.",
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
        if (
          !controller.signal.aborted &&
          actionEpoch.current === restoreEpoch
        ) {
          setRestoreFailed(true);
          setError(
            error instanceof Error
              ? error.message
              : "Your saved domain setup could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRestoring(false);
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
    if (data && current === sequence.current) {
      setResults(data.results);
      setSearched(true);
    }
  }
  async function select(result: RegistrarQuote) {
    setReviewSection("details");
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
    if (
      !quote ||
      discoveryOnly ||
      !terms ||
      !transmit ||
      busy ||
      reviewSection !== "confirm" ||
      (live && quote.taxPending)
    )
      return;
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
        authorizeLaunchConnection: terms,
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
    if (!quote || !live || discoveryOnly) return false;
    const current = addressSequence.current;
    const data = await call({
      action: "tax_quote",
      quoteId: quote.id,
      address: contact.address,
    });
    if (data && current === addressSequence.current) {
      setQuote({ ...quote, ...data.quote });
      setTerms(false);
      intent.current = crypto.randomUUID();
      return true;
    }
    return false;
  }
  function requestSupport(event: React.MouseEvent<HTMLButtonElement>) {
    void call({ action: "support", kind: event.currentTarget.dataset.kind });
  }
  async function reviewDetails(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (live && quote?.taxPending && !(await calculateFinalPrice())) return;
    setTerms(false);
    setTransmit(false);
    setReviewSection("confirm");
  }
  function changeAddress(key: keyof typeof contact.address, value: string) {
    addressSequence.current++;
    setContact((current) => ({
      ...current,
      address: { ...current.address, [key]: value },
    }));
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
          placeholder={key === "phone" ? "+12125550100" : undefined}
          autoComplete={
            {
              firstName: "given-name",
              lastName: "family-name",
              organization: "organization",
              email: "email",
              phone: "tel",
            }[key]
          }
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

  const checkoutOpen = Boolean(checkout);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const selector =
      screen === "review" && !checkoutOpen
        ? window.matchMedia("(max-width: 640px)").matches
          ? `.${styles.summary} h3`
          : `.${styles.panel} h3`
        : "h2, h3";
    const heading = workspaceRef.current?.querySelector<HTMLElement>(selector);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest" });
  }, [screen, reviewSection, checkoutOpen]);

  if (live && !canManage && !discoveryOnly)
    return (
      <p role="status">
        The customer owner must sign in directly to authorize domain purchases
        and manage registrar access.
      </p>
    );

  if (restoring || restoreFailed)
    return (
      <section
        className={styles.workspace}
        aria-label="Domain and hosting setup"
      >
        <div className={styles.panel}>
          <DomainSectionHeading
            icon={restoreFailed ? CircleHelp : Globe2}
            title={
              restoreFailed
                ? "Let’s recover your saved setup"
                : "Loading your domain setup"
            }
          >
            {restoreFailed
              ? "We couldn’t check your saved order. Try loading it again before starting a new purchase."
              : "Checking for a saved address or order so you can continue where you left off."}
          </DomainSectionHeading>
          {restoreFailed ? (
            <>
              <p className={styles.error} role="alert">
                {error}
              </p>
              <button
                className={styles.primary}
                disabled={busy}
                onClick={async () => {
                  if (simulation && !stripeTest) {
                    const data = await call({
                      action: "reset",
                      scenario: "normal",
                    });
                    if (data) {
                      orderId.current = null;
                      setQuote(null);
                      setCheckout(null);
                      setResults([]);
                      setRestoreFailed(false);
                      setScreen("choose");
                    }
                  } else window.location.reload();
                }}
              >
                {simulation && !stripeTest
                  ? "Start a fresh fictional test"
                  : "Try again"}
                <RefreshCw size={15} aria-hidden="true" />
              </button>
            </>
          ) : (
            <p className={styles.note} role="status">
              <Loader2
                size={17}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Loading saved setup…
            </p>
          )}
        </div>
      </section>
    );

  const previewOnly = discoveryOnly || (!simulation && !stripeTest && !live);
  const progress = order ? customerDomainProgress(order, registration) : null;
  const currentStep = checkout
    ? 2
    : screen === "review"
      ? reviewSection === "details" && !previewOnly
        ? 1
        : 2
      : screen === "progress"
        ? !order
          ? 0
          : progress?.tone === "success" || progress?.tone === "ready"
            ? 4
            : order.registrationState === "awaiting_payment"
              ? 2
              : 3
        : 0;

  return (
    <section
      ref={workspaceRef}
      className={styles.workspace}
      aria-label="Domain and hosting setup"
    >
      {simulation ? (
        <div className={styles.simulation}>
          <span>
            <ShieldCheck size={16} aria-hidden="true" /> TEST WORKSPACE ·{" "}
            {testClientName ?? view.client?.name ?? "Willow & Pine"}
          </span>
          <p>
            {stripeTest
              ? `Isolated Stripe test checkout with ${testRegistrar === "namecom" ? "the Name.com sandbox" : testRegistrar === "openprovider" ? "the Openprovider sandbox" : "a mock registrar"}. Use fictional contact information and test cards only. No real domain or production DNS changes.`
              : "Fictional client, simulated prices and payments. No real domain is purchased and no DNS is changed. Test progress is kept for one hour."}
          </p>
        </div>
      ) : null}
      {screen === "choose" ? (
        <DomainIntro />
      ) : (
        <div className={styles.pageHeader}>
          <span className={styles.eyebrow}>
            <Globe2 size={14} aria-hidden="true" /> YOUR WEBSITE ADDRESS
          </span>
        </div>
      )}
      {screen !== "choose" && screen !== "existing" ? (
        <DomainSetupSteps current={currentStep} />
      ) : null}
      {notice ? (
        <p role="status" className={styles.notice}>
          <Check size={18} aria-hidden="true" />
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
        <>
          <div className={styles.choices}>
            <button
              type="button"
              className={styles.choice}
              disabled={busy}
              aria-label="Find a new domain"
              onClick={() => setScreen("search")}
            >
              <span className={styles.icon}>
                <Search size={22} aria-hidden="true" />
              </span>
              <h3>Find a new address</h3>
              <p>
                Choose a name for your business. Register and pay right here in
                Vigil.
              </p>
              <span className={styles.link}>
                Find my address <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
            <button
              type="button"
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
                <Link2 size={22} aria-hidden="true" />
              </span>
              <h3>Use an address I own</h3>
              <p>
                Already bought a domain? Keep it with your provider and connect
                it to your website.
              </p>
              <span className={styles.link}>
                Connect my address <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
          </div>
          <details className={styles.disclosure}>
            <summary>
              <CircleHelp size={16} aria-hidden="true" />
              Not sure if you have a domain?
            </summary>
            <p>
              Look for a web address you’ve purchased, such as yourbusiness.com.
              You might have a receipt from GoDaddy, Name.com, Squarespace, or
              another provider. A social media username isn’t a domain. You can
              leave this for later and keep using your website preview.
            </p>
          </details>
        </>
      ) : null}
      {screen === "search" && !checkout ? (
        <div className={styles.panel}>
          <DomainSectionHeading icon={Search} title="Find your website address">
            Start with your business name. We’ll show you what’s available.
          </DomainSectionHeading>
          <label className={styles.searchLabel} htmlFor="domain-search">
            Business name or domain
          </label>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              void search();
            }}
          >
            <input
              id="domain-search"
              value={input}
              maxLength={253}
              required
              onChange={(event) => {
                setInput(event.target.value);
                setSearched(false);
              }}
              placeholder="e.g. willowandpine.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
            />
            <button
              className={styles.primary}
              disabled={busy || (!canManage && !discoveryOnly)}
            >
              <Search size={17} aria-hidden="true" />
              {busy ? "Searching…" : "Search addresses"}
            </button>
          </form>
          <p className={styles.note}>
            {discoveryOnly
              ? "You can explore names here. The customer owner must sign in directly to purchase an eligible domain."
              : live
                ? "Register inside Vigil. No separate registrar account needed."
                : simulation
                  ? "Try willow-pine-demo to explore this fictional example."
                  : "Availability and prices are from Vercel. Purchasing is not enabled for this account."}
          </p>
          <div className={styles.results} aria-live="polite" aria-busy={busy}>
            {results.map((result) => (
              <div className={styles.result} key={result.fqdn}>
                <div>
                  <div className={styles.resultName}>
                    {result.availability === "available" ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <Globe2 size={17} aria-hidden="true" />
                    )}
                    <strong>{result.fqdn}</strong>
                  </div>
                  <p>
                    {result.availability === "available"
                      ? result.premium
                        ? "Premium address"
                        : "Available to register"
                      : result.availability === "unsupported"
                        ? live || discoveryOnly
                          ? "Not available through this service"
                          : "Not included in this test fixture"
                        : "Not available. Try another name."}
                  </p>
                </div>
                <div className={styles.price}>
                  {result.registration ? (
                    <>
                      <strong>
                        {money(result.registration.amountMinor)}
                        <small>
                          {" "}
                          / first year
                          {result.taxPending || discoveryOnly
                            ? " before tax"
                            : ""}
                        </small>
                      </strong>
                      <p>
                        Renewal estimate {money(result.renewal?.amountMinor)}
                        /year
                      </p>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy ||
                    result.availability !== "available" ||
                    (!canManage && !discoveryOnly)
                  }
                  onClick={() => void select(result)}
                  aria-label={`Choose ${result.fqdn}`}
                >
                  {discoveryOnly ? "View price" : "Choose address"}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
            {searched && !busy && !results.length && !error ? (
              <p className={styles.note}>
                No results yet. Try your full business name or an exact address
                such as yourbusiness.com.
              </p>
            ) : null}
          </div>
          {results.length ? (
            <p className={styles.note}>
              <Clock3 size={15} aria-hidden="true" />
              Availability can change. Your address is secured only after
              registration is confirmed.
            </p>
          ) : null}
        </div>
      ) : null}
      {checkout ? (
        <div className={styles.panel}>
          <DomainSectionHeading
            icon={LockKeyhole}
            title={live ? "Secure payment" : "Secure test payment"}
          >
            Finish payment below. We’ll confirm your registration on the next
            screen.
          </DomainSectionHeading>
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
          <button
            type="button"
            className={styles.textButton}
            disabled={busy}
            onClick={async () => {
              const data = await call({
                action: "status",
                orderId: checkout.orderId,
              });
              if (data) {
                setCheckout(null);
                setScreen("progress");
              }
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Return to saved order
          </button>
        </div>
      ) : null}
      {screen === "review" && quote && !checkout ? (
        <div className={styles.review}>
          <aside className={styles.summary} aria-label="Your domain price">
            <span className={styles.eyebrow}>
              <Globe2 size={13} aria-hidden="true" />
              YOUR SELECTED ADDRESS
            </span>
            <h3 tabIndex={-1}>{quote.fqdn}</h3>
            <p>Registered for one year · Owned by you</p>
            {reviewSection === "confirm" || previewOnly ? (
              <dl>
                <div>
                  <dt>Registration · 1 year</dt>
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
                  <dt>Sales tax {simulation ? "(test)" : ""}</dt>
                  <dd>
                    {quote.taxPending
                      ? "After your address"
                      : quote.taxMinor != null
                        ? money(quote.taxMinor)
                        : simulation
                          ? "$0.00"
                          : "Not quoted"}
                  </dd>
                </div>
                <div>
                  <dt>
                    {quote.taxPending || discoveryOnly
                      ? "Before tax"
                      : "Total today"}
                    {simulation ? " (test)" : ""}
                  </dt>
                  <dd>{money(quote.registration?.amountMinor)}</dd>
                </div>
              </dl>
            ) : (
              <dl>
                <div>
                  <dt>First year{quote.taxPending ? " before tax" : ""}</dt>
                  <dd>{money(quote.registration?.amountMinor)}</dd>
                </div>
              </dl>
            )}
            <p className={styles.note}>
              {quote.taxPending
                ? "We’ll calculate tax from your address before you approve the total."
                : "Your final price is shown before you continue to payment."}
            </p>
            <p className={styles.note}>
              <Clock3 size={15} aria-hidden="true" />A search result isn’t a
              reservation. Registration confirms your address.
            </p>
          </aside>
          <form
            className={styles.panel}
            onSubmit={
              reviewSection === "details" && !previewOnly
                ? reviewDetails
                : purchase
            }
          >
            <DomainSectionHeading
              icon={
                previewOnly
                  ? Eye
                  : reviewSection === "details"
                    ? UserRound
                    : CreditCard
              }
              title={
                previewOnly
                  ? "Your address, at a glance"
                  : reviewSection === "details"
                    ? "Who will own this address?"
                    : "Everything look right?"
              }
            >
              {previewOnly
                ? "Explore the price before you decide."
                : reviewSection === "details"
                  ? "Use the legal details of the person or business registering the domain."
                  : "Review your address, owner details and total before continuing to payment."}
            </DomainSectionHeading>
            {previewOnly ? (
              <div className={styles.notice}>
                <ShieldCheck size={20} aria-hidden="true" />
                <div>
                  <strong>
                    Search preview. No purchase will be submitted.
                  </strong>
                  <p>
                    This address is not reserved. The price includes Vigil’s
                    service fee and is before tax. Purchasing requires an
                    eligible customer owner account and an enabled purchase
                    policy. Your final total is shown before payment approval.
                  </p>
                </div>
              </div>
            ) : reviewSection === "details" ? (
              <>
                <fieldset className={styles.subsection} disabled={busy}>
                  <legend>
                    <UserRound size={16} aria-hidden="true" />
                    Domain owner
                  </legend>
                  <p>
                    The owner keeps the rights to this address, even if you
                    leave Vigil.
                  </p>
                  <div className={styles.formGrid}>
                    {field("firstName", "First name")}
                    {field("lastName", "Last name")}
                    <div className={styles.fullField}>
                      {field("organization", "Legal business name (optional)")}
                      <p className={styles.note}>
                        If entered, this business becomes the legal domain
                        holder. Leave blank to register as an individual.
                      </p>
                    </div>
                    {field("email", "Owner’s email", "email")}
                    {field("phone", "Phone with country code", "tel")}
                  </div>
                  <p className={styles.note}>
                    <Mail size={15} aria-hidden="true" />
                    {live
                      ? "Name.com, our registration provider, will email this owner to verify the domain. Use an inbox you can access."
                      : "The registrar will send an email to verify ownership. Use fictional details in this test."}
                  </p>
                </fieldset>
                <fieldset className={styles.subsection} disabled={busy}>
                  <legend>
                    <MapPin size={16} aria-hidden="true" />
                    Owner’s address
                  </legend>
                  <p>
                    {live
                      ? "Use the same address for registration and billing. We share it with Stripe to calculate the final tax. If those addresses differ, contact Vigil before buying."
                      : "These details are required to register a domain. Use a fictional address for this test."}
                  </p>
                  <div className={styles.formGrid}>
                    {(
                      [
                        ["line1", "Street address", "address-line1"],
                        [
                          "line2",
                          "Apartment / suite (optional)",
                          "address-line2",
                        ],
                        ["city", "City", "address-level2"],
                        ["region", "State / region", "address-level1"],
                        ["postalCode", "ZIP / postal code", "postal-code"],
                        ["country", "Country code", "country"],
                      ] as const
                    ).map(([key, label, autoComplete]) => (
                      <label
                        className={`${styles.field} ${key === "line1" || key === "line2" ? styles.fullField : ""}`}
                        key={key}
                      >
                        {live && key === "country" ? "Country" : label}
                        {live && key === "country" ? (
                          <select
                            value={contact.address.country}
                            onChange={(event) =>
                              changeAddress("country", event.target.value)
                            }
                            autoComplete={autoComplete}
                          >
                            <option value="US">United States</option>
                          </select>
                        ) : (
                          <input
                            required={key !== "line2"}
                            autoComplete={autoComplete}
                            maxLength={key === "country" ? 2 : 200}
                            value={contact.address[key]}
                            onChange={(event) =>
                              changeAddress(key, event.target.value)
                            }
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  {live && quote.policy?.automaticPurchaseRegions ? (
                    <p className={styles.scopeNote}>
                      Online registration currently supports{" "}
                      {quote.policy.automaticPurchaseRegions.join(", ")}{" "}
                      addresses. Contact Vigil for help elsewhere.
                    </p>
                  ) : null}
                </fieldset>
                {quote.contactSchema?.additional.length ? (
                  <fieldset className={styles.subsection} disabled={busy}>
                    <legend>
                      <FileText size={16} aria-hidden="true" />
                      Details required for this address
                    </legend>
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
                  </fieldset>
                ) : null}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy}
                    onClick={() => setScreen("search")}
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Change address
                  </button>
                  <button
                    type="submit"
                    className={styles.primary}
                    disabled={busy}
                  >
                    {busy ? "Calculating total…" : "Review price"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.contactReview}>
                  <div>
                    <strong>Registered to</strong>
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={busy}
                      onClick={() => {
                        setReviewSection("details");
                        setTerms(false);
                        setTransmit(false);
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit details
                    </button>
                  </div>
                  <p>
                    {contact.organization ||
                      `${contact.firstName} ${contact.lastName}`}
                  </p>
                  <p>
                    {contact.email} · {contact.phone}
                  </p>
                  <p>
                    {[
                      contact.address.line1,
                      contact.address.line2,
                      contact.address.city,
                      contact.address.region,
                      contact.address.postalCode,
                      contact.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                {live || testRegistrar === "namecom" ? (
                  <div className={styles.renewal}>
                    <div>
                      <CalendarDays size={16} aria-hidden="true" />
                      One year, with manual renewal
                    </div>
                    <p>
                      Renewal estimate: {money(quote.renewal?.amountMinor)}
                      /year.{" "}
                      {live
                        ? "Vigil will remind you before expiry. Renewal needs a separate request and approval."
                        : "Automatic renewal is off for this sandbox test."}
                    </p>
                  </div>
                ) : (
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(event) => {
                        setAutoRenew(event.target.checked);
                        setTerms(false);
                      }}
                    />
                    <span>
                      Enable annual renewal for this test domain. Renewal
                      estimate: {money(quote.renewal?.amountMinor)}/year; future
                      changes require advance notice.
                    </span>
                  </label>
                )}
                <label className={styles.check}>
                  <input
                    required
                    type="checkbox"
                    checked={transmit}
                    onChange={(event) => setTransmit(event.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    {live
                      ? "I confirm these registrant details, including this billing address, and approve sending the required contact details to the registrar."
                      : "I confirm these registrant details and approve sending them to the registrar."}
                  </span>
                </label>
                <label className={styles.check}>
                  <input
                    required
                    type="checkbox"
                    checked={terms}
                    disabled={busy || (live && quote.taxPending)}
                    onChange={(event) => setTerms(event.target.checked)}
                  />
                  <span>
                    I approve <b>{quote.fqdn}</b> for <b>one year</b> at{" "}
                    <b>{money(quote.registration?.amountMinor)}</b>, the renewal
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
                      {live ? "service terms" : "test service terms"}
                      <ExternalLink size={11} aria-hidden="true" />
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
                        .
                      </>
                    ) : null}
                    {" "}I authorize Vigil to connect this address to this website automatically after our website reviews and approvals, when Vigil deploys it. Existing email records will be preserved.
                  </span>
                </label>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy}
                    onClick={() => setScreen("search")}
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Change address
                  </button>
                  <button
                    className={styles.primary}
                    disabled={
                      busy ||
                      !terms ||
                      !transmit ||
                      !canManage ||
                      (live && quote.taxPending)
                    }
                    type="submit"
                  >
                    <LockKeyhole size={15} aria-hidden="true" />
                    {busy
                      ? "Preparing checkout…"
                      : live
                        ? `Continue to payment · ${money(quote.registration?.amountMinor)}`
                        : `Simulate purchase · ${money(quote.registration?.amountMinor)}`}
                  </button>
                </div>
                <p className={styles.note}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  {live
                    ? "Secure Stripe checkout. Payment is authorized first and charged after registration is confirmed. Vigil never receives your card number."
                    : stripeTest
                      ? "Embedded Stripe test checkout. Use test card details only."
                      : "No card details are collected. This demonstration cannot charge you."}
                </p>
              </>
            )}
            {previewOnly ? (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setScreen("search")}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Choose another address
              </button>
            ) : null}
          </form>
        </div>
      ) : null}
      {screen === "progress" && !checkout ? (
        <div className={styles.panel}>
          {!order ? (
            <>
              <DomainSectionHeading
                icon={Globe2}
                title="Your address will appear here"
              >
                Choose an address to start, or keep using your website preview.
              </DomainSectionHeading>
              <button
                className={styles.primary}
                onClick={() => setScreen("search")}
              >
                Find an address
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <div className={styles.statusHead}>
                <div>
                  <span className={styles.eyebrow}>
                    YOUR DOMAIN{simulation ? " · TEST" : ""}
                  </span>
                  <h3 tabIndex={-1}>{order.fqdn}</h3>
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
              {progress ? (
                <div
                  className={styles.statusMessage}
                  role="status"
                  data-tone={progress.tone}
                >
                  {progress.tone === "ready" ? <DomainCelebration domainId={order.id} milestone="ready" /> : null}
                  {progress.tone === "success" || progress.tone === "ready" ? (
                    <ShieldCheck size={27} aria-hidden="true" />
                  ) : progress.tone === "attention" ? (
                    <AlertTriangle size={25} aria-hidden="true" />
                  ) : (
                    <Globe2 size={27} aria-hidden="true" />
                  )}
                  <div>
                    <h4>{progress.title}</h4>
                    <p>
                      {simulation && !live
                        ? progress.description.replace(
                            "Name.com",
                            "the test registrar",
                          )
                        : progress.description}
                    </p>
                  </div>
                </div>
              ) : null}
              <ol
                className={styles.timeline}
                aria-label="Registration and connection status"
              >
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
                        ? "Owner’s email verified"
                        : registration
                          ? "Verify owner’s email"
                          : "Owner’s email pending",
                    done: registration?.contactVerification === "verified",
                  },
                  {
                    label:
                      order.connectionState === "live" && !assetStateLabel
                        ? "Website connected securely"
                        : progress?.tone === "ready" ? "Ready for Vigil’s website launch" : "Website connection pending",
                    done: (order.connectionState === "live" || progress?.tone === "ready") && !assetStateLabel,
                  },
                ].map((step, index) => (
                  <li key={index} data-done={step.done}>
                    <span aria-hidden="true">
                      {step.done ? <Check size={14} /> : index + 1}
                    </span>
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
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : null}
              {order.reason &&
              ![
                "contact_required",
                "capture_failed",
                "provider_unknown",
                "refund_pending",
              ].includes(order.reason) ? (
                <p className={styles.notice}>
                  {reasonText(order.reason, simulation)}
                </p>
              ) : null}
              {progress?.tone === "ready" ? (
                <DomainReadyHandoff
                  simulation={simulation}
                  automaticConnection={view.launchHandoff?.automaticConnection === true}
                  staffNotified={view.launchHandoff?.staffNotified === true}
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
                  <button
                    className={styles.secondary}
                    disabled={busy}
                    onClick={() => void call({ action: "reconcile" })}
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    Recheck test status
                  </button>
                </div>
              ) : null}
              {live && order.connectionState === "live" && !assetStateLabel ? (
                <a
                  className={styles.primary}
                  href={`https://www.${order.fqdn}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit your website
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              {stripeTest || live ? (
                <div className={styles.actions}>
                  <button
                    className={styles.secondary}
                    disabled={busy}
                    onClick={() => void call({ action: "reconcile" })}
                  >
                    <RefreshCw size={15} aria-hidden="true" />
                    {busy ? "Checking…" : "Refresh status"}
                  </button>
                </div>
              ) : null}
              {registration ? (
                <details className={styles.disclosure}>
                  <summary>
                    <ReceiptText size={16} aria-hidden="true" />
                    Registration & receipt
                  </summary>
                  <div className={styles.manage}>
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
                        <dt>Renewal</dt>
                        <dd>
                          {registration.autoRenew
                            ? live
                              ? "Enabled at registrar · needs review"
                              : "Automatic renewal approved"
                            : "Manual renewal"}
                        </dd>
                      </div>
                      {order.priceBreakdown ? (
                        <>
                          <div>
                            <dt>Registration</dt>
                            <dd>
                              {money(order.priceBreakdown.registrationMinor)}
                            </dd>
                          </div>
                          <div>
                            <dt>Vigil service fee</dt>
                            <dd>
                              {money(order.priceBreakdown.serviceFeeMinor)}
                            </dd>
                          </div>
                          <div>
                            <dt>Sales tax</dt>
                            <dd>{money(order.priceBreakdown.taxMinor)}</dd>
                          </div>
                        </>
                      ) : null}
                      <div>
                        <dt>Order total {simulation ? "(test)" : ""}</dt>
                        <dd>
                          {money(order.totalMinor)} ·{" "}
                          {labels[order.paymentState] ?? order.paymentState}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </details>
              ) : null}
              {(view.registrationId && (!simulation || live)) ||
              (simulation && !stripeTest && registration) ? (
                <details className={styles.disclosure}>
                  <summary>
                    <CircleHelp size={16} aria-hidden="true" />
                    Help & domain settings
                  </summary>
                  <p>
                    Need to renew, update ownership details, or move your
                    address? Vigil can help. A request does not change your
                    registration or charge you.
                  </p>
                  <div className={styles.actions}>
                    {live ? (
                      (
                        [
                          ["renewal", "Request renewal"],
                          ["contact_verification", "Get verification help"],
                          ["payment_reconciliation", "Get payment help"],
                          ["release", "Request domain release / transfer"],
                        ] as const
                      ).map(([kind, label]) => (
                        <button
                          key={kind}
                          className={styles.secondary}
                          disabled={
                            busy ||
                            (kind === "release" && view.transferRequested)
                          }
                          data-kind={kind}
                          onClick={requestSupport}
                        >
                          {label}
                        </button>
                      ))
                    ) : simulation && !stripeTest && registration ? (
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
                    ) : (
                      <button
                        className={styles.secondary}
                        disabled={busy || view.transferRequested || !canManage}
                        onClick={() =>
                          void call({
                            action: "transfer",
                            registrationId: view.registrationId,
                          })
                        }
                      >
                        Request domain release / transfer
                      </button>
                    )}
                  </div>
                </details>
              ) : null}
              <p className={styles.note}>
                <Eye size={15} aria-hidden="true" />
                Your website preview stays available. Registering an address
                doesn’t publish the website.
              </p>
            </>
          )}
        </div>
      ) : null}
      {screen === "existing" ? (
        <div className={styles.panel}>
          <DomainSectionHeading
            icon={Link2}
            title="Use the address you already own"
          >
            Enter your web address. We’ll help connect it to your website.
          </DomainSectionHeading>
          <label className={styles.searchLabel} htmlFor="existing-domain">
            Your existing domain
          </label>
          <form
            className={styles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setDnsConsent(false);
              void call({ action: "existing", fqdn: existing, supported });
            }}
          >
            <input
              id="existing-domain"
              value={existing}
              onChange={(event) => setExisting(event.target.value)}
              placeholder="yourbusiness.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button
              className={styles.primary}
              disabled={busy || !canManage || stripeTest}
            >
              Check connection
              <ArrowRight size={16} aria-hidden="true" />
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
                  Your request is visible to Vigil. We’ll help you connect this
                  address with your provider. Please don’t send a password.
                </p>
              ) : view.existing.status === "ready_for_launch" ? (
                <p>
                  Connection authorized and ready for the approved launch.
                  Existing email records are preserved.
                </p>
              ) : (
                <>
                  <p>
                    {simulation
                      ? "Review these simulated website-only changes:"
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
                        Simulate connection approval
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
          <button
            className={styles.textButton}
            type="button"
            disabled={busy}
            onClick={() => setScreen("choose")}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            All domain options
          </button>
        </div>
      ) : null}
      {simulation && !stripeTest ? (
        <details className={styles.testControls}>
          <summary>Demo operator controls</summary>
          {order?.registrationState === "registered" && order.connectionState !== "live" ? (
            <div className={styles.testLaunch}>
              <p>Admin simulation only: imagine the website has completed all client and Vigil reviews, and Vigil has deployed the final production build.</p>
              <button className={styles.secondary} disabled={busy || registration?.contactVerification !== "verified" || order.paymentState !== "paid"} onClick={() => void call({ action: "launch" })}>Simulate Vigil admin deployment</button>
            </div>
          ) : null}
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
                setCheckout(null);
                orderId.current = null;
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
function reasonText(reason: string, simulation = false) {
  return (
    (
      {
        payment_failed:
          "Payment was not completed. Recheck your saved order and resume its checkout, or contact Vigil for help.",
        quote_expired:
          "The quote expired. Review a fresh quote before approving another payment.",
        price_changed: `The price changed before registration. The ${simulation ? "test " : ""}authorization was released; review a fresh quote to continue.`,
        unavailable: `The name became unavailable. The ${simulation ? "test " : ""}authorization was released.`,
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
