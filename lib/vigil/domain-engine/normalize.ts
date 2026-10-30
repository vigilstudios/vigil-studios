import "server-only";
import { domainToASCII, domainToUnicode } from "node:url";
import { parse } from "tldts";
import { DomainEngineError } from "./errors";

export function normalizeDomain(
  input: string,
  options: { registration?: boolean } = {},
) {
  let value = input.trim();
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw invalid();
    }
    if (
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw invalid();
    value = url.hostname;
  }
  if (/[\s/@:#?\\]/.test(value)) throw invalid();
  const fqdn = domainToASCII(value.replace(/\.$/, "")).toLowerCase();
  if (
    !fqdn ||
    fqdn.length > 253 ||
    fqdn
      .split(".")
      .some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
  )
    throw invalid();
  const parsed = parse(fqdn, { allowPrivateDomains: false });
  if (
    !parsed.isIcann ||
    !parsed.domain ||
    parsed.isIp ||
    (options.registration && parsed.domain !== fqdn)
  )
    throw invalid();
  return {
    fqdn,
    displayName: domainToUnicode(fqdn),
    registrableDomain: parsed.domain,
    tld: parsed.publicSuffix!,
    requiresIdnReview: fqdn
      .split(".")
      .some((label) => label.startsWith("xn--")),
  };
}

function invalid() {
  return new DomainEngineError(
    "invalid_domain",
    "Enter a valid public domain name.",
  );
}
