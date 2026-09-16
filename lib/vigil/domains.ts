import { getDomain } from "tldts";

/** Registrable apex according to the public suffix list (`example.co.uk`, not `co.uk`). */
export function registrableDomain(hostname: string): string {
  return getDomain(hostname, { allowPrivateDomains: true }) ?? hostname;
}

export function domainKind(hostname: string): "apex" | "subdomain" {
  return registrableDomain(hostname) === hostname ? "apex" : "subdomain";
}

/** Host/name value expected by registrar DNS forms. */
export function relativeDnsName(hostname: string): string {
  const apex = registrableDomain(hostname);
  return hostname === apex ? "@" : hostname.slice(0, -(apex.length + 1));
}
