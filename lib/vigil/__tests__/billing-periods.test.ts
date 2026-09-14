import { describe, expect, it } from "vitest";
import { billingPeriod, billingPeriodByKey, describePrice, planPriceLookupKey, savingsPercent } from "../billing-periods";
import { formatMoney } from "../format";

describe("billing periods", () => {
  it("maps rows to periods and back", () => {
    expect(billingPeriod("year", 3)?.key).toBe("year3");
    expect(billingPeriod("month", 1)?.key).toBe("month");
    expect(billingPeriod("year", 2)).toBeNull();
    expect(billingPeriodByKey("year")?.months).toBe(12);
  });
  it("builds stable provider lookup keys", () => {
    expect(planPriceLookupKey("care", "usd", "month", 1)).toBe("plan:care:usd:month");
    expect(planPriceLookupKey("care", "usd", "year", 3)).toBe("plan:care:usd:year3");
    expect(planPriceLookupKey("care", "usd", "year", 2)).toBe("plan:care:usd:year2");
  });
  it("computes the saving against paying monthly (owner's table)", () => {
    expect(savingsPercent(29000, 12, 2900)).toBe(17);
    expect(savingsPercent(77900, 36, 2900)).toBe(25);
    expect(savingsPercent(267000, 36, 9900)).toBe(25);
    expect(savingsPercent(2900, 1, 2900)).toBeNull();
    expect(savingsPercent(40000, 12, 2900)).toBeNull();
    expect(savingsPercent(1, 12, null)).toBeNull();
  });
  it("describes a price row in words", () => {
    expect(describePrice({ amount_cents: 9900, currency: "usd", interval: "month", interval_count: 1 }, formatMoney)).toBe("$99.00 / month");
    expect(describePrice({ amount_cents: 267000, currency: "usd", interval: "year", interval_count: 3 }, formatMoney)).toBe("$2,670.00 / 3 years");
    expect(describePrice({ amount_cents: null, currency: "usd", interval: "year" }, formatMoney)).toBe("Not set");
  });
});
