import "server-only";
import { assertDomainTestDatabase } from "./runtime";
import { DomainEngineError } from "./errors";

/** Fictional sandbox pricing only; live quotes use durable approved policies. */
export function domainTestPrice(costMinor: number) {
  assertDomainTestDatabase();
  const fee = Number(process.env.VIGIL_DOMAIN_TEST_SERVICE_FEE_MINOR ?? 0);
  const maximum = Number(process.env.VIGIL_DOMAIN_TEST_MAX_TOTAL_MINOR ?? 3000);
  if (
    !Number.isSafeInteger(costMinor) ||
    costMinor <= 0 ||
    !Number.isSafeInteger(fee) ||
    fee < 0 ||
    fee > 10000 ||
    !Number.isSafeInteger(maximum) ||
    maximum <= 0 ||
    maximum > 100000 ||
    costMinor + fee > maximum
  ) {
    throw new DomainEngineError(
      "test_price_limit",
      "This quote exceeds the approved sandbox checkout limit.",
      422,
    );
  }
  return {
    serviceFeeMinor: fee,
    subtotalMinor: costMinor + fee,
    taxMinor: 0,
    totalMinor: costMinor + fee,
  };
}
