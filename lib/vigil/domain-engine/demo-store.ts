import "server-only";
import { assertMockAllowed, type DomainEngineConfig } from "./config";
import type {
  DomainOrderStore,
  DomainOrderPatch,
  OrderContext,
  DomainPaymentOperations,
} from "./orchestrator";
import type { RegistrarDomain, RegistrarOrder } from "./contracts";

/** Explicitly non-durable fake for tests/demo only; production uses SupabaseDomainOrderStore. */
export class DemoDomainStore implements DomainOrderStore {
  readonly orders = new Map<
    string,
    OrderContext & { connectionState: string; reason: string | null }
  >();
  readonly events: { orderId: string; patch: DomainOrderPatch }[] = [];
  readonly registrations = new Map<string, RegistrarDomain>();
  constructor(config: DomainEngineConfig) {
    assertMockAllowed(config);
  }
  async load(id: string): Promise<OrderContext> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Domain order not found.");
    return structuredClone(order);
  }
  async claimRegistration(id: string) {
    const order = this.orders.get(id);
    if (
      !order ||
      !["awaiting_payment", "ready"].includes(order.registrationState) ||
      !["authorized", "paid"].includes(order.paymentState)
    )
      return false;
    order.registrationState = "submitting";
    return true;
  }
  async update(id: string, patch: DomainOrderPatch) {
    const order = this.orders.get(id);
    if (!order) throw new Error("Domain order not found.");
    if (
      order.registrationState === "registered" &&
      patch.registrationState &&
      patch.registrationState !== "registered"
    )
      throw new Error("A registered domain cannot become a failed purchase.");
    Object.assign(order, patch);
    this.events.push({ orderId: id, patch: structuredClone(patch) });
  }
  async linkRegistrarOrder(id: string, order: RegistrarOrder) {
    const row = this.orders.get(id);
    if (!row) throw new Error("Domain order not found.");
    row.registrarOrderRef = order.externalId;
  }
  async registered(id: string, domain: RegistrarDomain) {
    this.registrations.set(id, structuredClone(domain));
  }
}
export class DemoDomainPayments implements DomainPaymentOperations {
  readonly environment = "test" as const;
  readonly captures = new Set<string>();
  readonly refunds = new Set<string>();
  readonly cancellations = new Set<string>();
  constructor(
    config: DomainEngineConfig,
    private readonly failCapture = false,
  ) {
    assertMockAllowed(config);
  }
  async capture(order: OrderContext) {
    if (this.failCapture) throw new Error("Simulated capture failure.");
    this.captures.add(order.id);
  }
  async cancel(order: OrderContext) {
    this.cancellations.add(order.id);
  }
  async refund(order: OrderContext) {
    this.refunds.add(order.id);
  }
  async releaseFailedPayment(order: OrderContext) {
    if (order.paymentState === "paid") {
      await this.refund(order);
      return "refunded" as const;
    }
    await this.cancel(order);
    return "canceled" as const;
  }
}
