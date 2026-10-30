import "server-only";
import { randomUUID } from "node:crypto";
import { readDomainEngineConfig, assertMockAllowed } from "./config";
import { DemoDomainPayments, DemoDomainStore } from "./demo-store";
import { MockRegistrarAdapter, type MockDomainFixture } from "./mock";
import { domainCandidates } from "./search";
import { purchaseApprovalSchema } from "./validation";
import { DomainEngineError } from "./errors";
import { processDomainOrder } from "./orchestrator";
import type { RegistrarQuote } from "./contracts";
import { normalizeDomain } from "./normalize";

export const DEMO_CLIENT = {
  name: "Willow & Pine",
  label: "Fictional test client",
  organizationId: "10000000-0000-0000-0000-000000000099",
};
export const DEMO_FIXTURES: Readonly<Record<string, MockDomainFixture>> = {
  "willow-pine-demo.com": { amountMinor: 1800, renewalMinor: 2200 },
  "willow-pine-demo.net": { amountMinor: 1600, renewalMinor: 1900 },
  "willow-pine-demo.org": {
    amountMinor: 2100,
    renewalMinor: 2400,
    available: false,
  },
};
const scenarios = [
  "normal",
  "pending",
  "unknown",
  "capture_failed",
  "price_changed",
  "sold",
] as const;
type Scenario = (typeof scenarios)[number];
type Session = {
  expiresAt: number;
  scenario: Scenario;
  registrar: MockRegistrarAdapter;
  store: DemoDomainStore;
  payments: DemoDomainPayments;
  quotes: Map<string, RegistrarQuote>;
  latestOrderId: string | null;
  existing: { fqdn: string; status: string; supported: boolean } | null;
  released: boolean;
};
const processState = globalThis as typeof globalThis & {
  __vigilDomainDemoSessions?: Map<string, Session>;
};
const sessions = (processState.__vigilDomainDemoSessions ??= new Map<
  string,
  Session
>());

export function createDemoSession(scenario: Scenario = "normal") {
  const config = readDomainEngineConfig();
  assertMockAllowed(config);
  for (const [id, session] of sessions)
    if (session.expiresAt < Date.now()) sessions.delete(id);
  if (sessions.size >= 100)
    throw new DomainEngineError(
      "demo_busy",
      "The test workspace is busy. Try again shortly.",
      429,
    );
  const fixtures = Object.fromEntries(
    Object.entries(DEMO_FIXTURES).map(([key, value]) => [
      key,
      {
        ...value,
        ...(scenario === "pending"
          ? { outcome: "pending" as const }
          : scenario === "unknown"
            ? { outcome: "unknown" as const }
            : {}),
      },
    ]),
  );
  const id = randomUUID();
  sessions.set(id, {
    expiresAt: Date.now() + 3_600_000,
    scenario,
    registrar: new MockRegistrarAdapter(fixtures, config),
    store: new DemoDomainStore(config),
    payments: new DemoDomainPayments(config, scenario === "capture_failed"),
    quotes: new Map(),
    latestOrderId: null,
    existing: null,
    released: false,
  });
  return id;
}
export async function runDemoAction(
  sessionId: string,
  action: Record<string, unknown>,
) {
  assertMockAllowed(readDomainEngineConfig());
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now())
    throw new DomainEngineError(
      "demo_expired",
      "Your test workspace expired. Start a new test.",
      410,
    );
  if (action.action === "search") {
    const names = domainCandidates(String(action.input ?? ""));
    return {
      results: await session.registrar.searchAndPrice(names),
      ...snapshot(session),
    };
  }
  if (action.action === "quote") {
    const fqdn = normalizeDomain(String(action.fqdn ?? ""), {
      registration: true,
    }).fqdn;
    const [quote] = await session.registrar.searchAndPrice([fqdn]);
    if (quote.availability !== "available")
      throw new DomainEngineError(
        "unavailable",
        "This name is not available in the test fixture.",
      );
    const quoteId = randomUUID();
    session.quotes.set(quoteId, structuredClone(quote));
    return { quote: { ...quote, id: quoteId }, ...snapshot(session) };
  }
  if (action.action === "purchase") {
    const approval = purchaseApprovalSchema.parse(action.approval);
    const quote = session.quotes.get(approval.quoteId);
    if (
      !quote ||
      !quote.registration ||
      quote.registration.amountMinor !== approval.totalMinor ||
      quote.registration.currency !== approval.currency
    )
      throw new DomainEngineError(
        "quote_mismatch",
        "Review the selected name and price again.",
      );
    if (Date.parse(quote.expiresAt) <= Date.now())
      throw new DomainEngineError(
        "quote_expired",
        "This quote expired. Search again for a current price.",
      );
    const existing = session.store.orders.get(approval.intentId);
    if (existing) {
      if (
        existing.fqdn !== quote.fqdn ||
        JSON.stringify(existing.contact) !== JSON.stringify(approval.contact) ||
        existing.autoRenew !== approval.autoRenew
      )
        throw new DomainEngineError(
          "intent_mismatch",
          "This test purchase no longer matches its approval.",
        );
    } else {
      if (
        [...session.store.orders.values()].some(
          (order) =>
            order.fqdn === quote.fqdn &&
            !["failed"].includes(order.registrationState),
        )
      )
        throw new DomainEngineError(
          "order_exists",
          "This domain already has a test order. Check its status.",
        );
      session.store.orders.set(approval.intentId, {
        id: approval.intentId,
        organizationId: DEMO_CLIENT.organizationId,
        fqdn: quote.fqdn,
        years: quote.years,
        autoRenew: approval.autoRenew,
        acceptanceId: randomUUID(),
        registrar: "mock",
        environment: "test",
        registrarAmountMinor: quote.registration.amountMinor,
        totalMinor: approval.totalMinor,
        currency: approval.currency,
        quoteExpiresAt: quote.expiresAt,
        registrationState: "ready",
        paymentState: "authorized",
        paymentRef: `mock_payment_${approval.intentId}`,
        registrarOrderRef: null,
        contact: approval.contact,
        connectionState: "not_started",
        reason: null,
      });
    }
    session.latestOrderId = approval.intentId;
    if (session.scenario === "price_changed" || session.scenario === "sold") {
      await session.store.update(approval.intentId, {
        registrationState: "failed",
        paymentState: "canceled",
        reason: session.scenario === "sold" ? "unavailable" : "price_changed",
      });
    } else
      await processDomainOrder(
        session.store,
        session.registrar,
        session.payments,
        approval.intentId,
      );
    return snapshot(session);
  }
  if (action.action === "status") return snapshot(session);
  if (action.action === "reconcile" && session.latestOrderId) {
    await processDomainOrder(
      session.store,
      session.registrar,
      session.payments,
      session.latestOrderId,
    );
    return snapshot(session);
  }
  if (action.action === "verify_contact" && session.latestOrderId) {
    const domain = session.store.registrations.get(session.latestOrderId);
    if (domain) domain.contactVerification = "verified";
    return snapshot(session);
  }
  if (action.action === "launch" && session.latestOrderId) {
    const order = await session.store.load(session.latestOrderId);
    const domain = session.store.registrations.get(order.id);
    if (
      order.registrationState !== "registered" ||
      order.paymentState !== "paid" ||
      domain?.contactVerification !== "verified"
    )
      throw new DomainEngineError(
        "launch_not_ready",
        "Complete registration, payment and email verification first.",
      );
    await session.store.update(order.id, {
      connectionState: "live",
      reason: null,
    });
    return snapshot(session);
  }
  if (action.action === "renewal" && session.latestOrderId) {
    if (action.consent !== true)
      throw new DomainEngineError(
        "consent_required",
        "Approve the test renewal preference first.",
      );
    const order = await session.store.load(session.latestOrderId);
    await session.registrar.setAutoRenew(order.fqdn, action.enabled === true);
    const domain = session.store.registrations.get(order.id);
    if (domain) domain.autoRenew = action.enabled === true;
    return snapshot(session);
  }
  if (action.action === "transfer" && session.latestOrderId) {
    const order = await session.store.load(session.latestOrderId);
    await session.registrar.requestTransferOut(order.fqdn);
    session.released = true;
    return snapshot(session);
  }
  if (action.action === "existing") {
    session.existing = {
      fqdn: normalizeDomain(String(action.fqdn ?? "")).fqdn,
      supported: action.supported !== false,
      status:
        action.supported === false
          ? "assistance_required"
          : "authorization_required",
    };
    return snapshot(session);
  }
  if (action.action === "authorize_dns" && session.existing) {
    if (action.consent !== true || !session.existing.supported)
      throw new DomainEngineError(
        "dns_consent_required",
        "Approve the exact website records first.",
      );
    session.existing.status = "ready_for_launch";
    return snapshot(session);
  }
  throw new DomainEngineError(
    "invalid_demo_action",
    "That test action is unavailable.",
  );
}
export function parseDemoScenario(value: unknown): Scenario {
  return scenarios.includes(value as Scenario) ? (value as Scenario) : "normal";
}
function snapshot(session: Session) {
  const order = session.latestOrderId
    ? session.store.orders.get(session.latestOrderId)
    : null;
  const domain = session.latestOrderId
    ? session.store.registrations.get(session.latestOrderId)
    : null;
  return {
    client: DEMO_CLIENT,
    scenario: session.scenario,
    order: order
      ? {
          id: order.id,
          fqdn: order.fqdn,
          totalMinor: order.totalMinor,
          currency: order.currency,
          registrationState: order.registrationState,
          paymentState: order.paymentState,
          connectionState: order.connectionState,
          reason: order.reason,
        }
      : null,
    registration: domain
      ? {
          expiresAt: domain.expiresAt,
          autoRenew: domain.autoRenew,
          contactVerification: domain.contactVerification,
        }
      : null,
    existing: session.existing,
    transferRequested: session.released,
  };
}
