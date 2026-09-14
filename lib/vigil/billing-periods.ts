/**
 * Billing periods a plan can be bought for. The rows in plan_prices carry
 * (interval, interval_count); this maps them to a stable key used in forms,
 * lookup keys and copy. Adding a period = a row plus an entry here.
 */
export type BillingPeriodKey = "month" | "year" | "year3";

export type BillingPeriod = {
  key: BillingPeriodKey;
  interval: "month" | "year";
  intervalCount: number;
  /** Short label for the picker. */
  label: string;
  /** "a month", "a year", "every 3 years" — used in sentences. */
  every: string;
  /** Months covered, for the monthly-equivalent maths. */
  months: number;
};

export const BILLING_PERIODS: BillingPeriod[] = [
  { key: "month", interval: "month", intervalCount: 1, label: "Monthly", every: "a month", months: 1 },
  { key: "year", interval: "year", intervalCount: 1, label: "Annual", every: "a year", months: 12 },
  { key: "year3", interval: "year", intervalCount: 3, label: "3 years", every: "every 3 years", months: 36 },
];

export function billingPeriod(interval: string, intervalCount: number): BillingPeriod | null {
  return BILLING_PERIODS.find((p) => p.interval === interval && p.intervalCount === intervalCount) ?? null;
}

export function billingPeriodByKey(key: string): BillingPeriod | null {
  return BILLING_PERIODS.find((p) => p.key === key) ?? null;
}

/** Provider lookup key for a plan price: "plan:care:usd:month", "plan:care:usd:year3". */
export function planPriceLookupKey(planCode: string, currency: string, interval: string, intervalCount: number): string {
  const period = billingPeriod(interval, intervalCount);
  const suffix = period ? period.key : `${interval}${intervalCount > 1 ? intervalCount : ""}`;
  return `plan:${planCode}:${currency}:${suffix}`;
}

/** Whole-percent saving of a longer period against paying monthly for the same span. */
export function savingsPercent(periodCents: number, months: number, monthlyCents: number | null): number | null {
  if (!monthlyCents || months <= 1) return null;
  const full = monthlyCents * months;
  if (full <= 0 || periodCents >= full) return null;
  return Math.round((1 - periodCents / full) * 100);
}

/** "$99 / month", "$990 / year", "$2,670 / 3 years" from a price row. */
export function describePrice(price: { amount_cents: number | null; currency: string; interval: string; interval_count?: number | null }, formatMoney: (cents: number | null | undefined, currency?: string) => string): string {
  if (price.amount_cents === null) return "Not set";
  const count = price.interval_count ?? 1;
  const unit = count > 1 ? `${count} ${price.interval}s` : price.interval;
  return `${formatMoney(price.amount_cents, price.currency)} / ${unit}`;
}
