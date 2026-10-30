import "server-only";
import type { DbClient } from "@/lib/vigil/types";
import { NamecomProductionRegistrar } from "./namecom-production";
import { getDomainLaunchProfile } from "./launch-profile";
import { liveUnavailable } from "./live-policy";
import { domainCandidates } from "./search";

/** This factory receives no purchasing/DNS authority. Availability calls are read-only. */
export async function discoverProductionDomains(admin: DbClient, input: string, exact = false) {
  const p = await getDomainLaunchProfile(admin);
  if (!p) throw liveUnavailable("Domain search is temporarily unavailable.");
  const registrar = new NamecomProductionRegistrar(process.env.VIGIL_NAMECOM_USERNAME ?? "", process.env.VIGIL_NAMECOM_TOKEN ?? "", p.max_registrar_minor);
  const results = await registrar.searchAndPrice(exact ? [input] : domainCandidates(input));
  const { data: owned, error } = await admin.from("domain_registrations").select("fqdn").eq("environment", "live").neq("registration_status", "released").in("fqdn", results.map(r => r.fqdn));
  if (error) throw liveUnavailable("Domain search is temporarily unavailable.");
  return results.map(r => {
    const cost = r.registration?.amountMinor;
    if (owned?.some(a => a.fqdn === r.fqdn)) return { ...r, availability: "unavailable" as const, registration: null, renewal: null };
    if (!r.registration || r.availability !== "available") return r;
    if (cost == null || cost > p.max_registrar_minor || cost + p.service_fee_minor > p.max_client_minor) return { ...r, availability: "unsupported" as const, registration: null, renewal: null };
    return { ...r, registration: { ...r.registration!, amountMinor: cost + p.service_fee_minor },
      subtotalMinor: cost + p.service_fee_minor, serviceFeeMinor: p.service_fee_minor, taxPending: true,
      policy: { termsUrl: p.terms_url, registrationAgreementUrl: p.registration_agreement_url, renewalModel: "manual", taxDescription: "Final tax is calculated from your US address before you approve payment." },
    };
  });
}
