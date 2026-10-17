import { REGISTRAR_GUIDES } from "./domain-guides";
import type { RegistrarKey } from "./onboarding/brief";
import { registrableDomain } from "./domains";

export type GuideDomain = {
  domainId: string; hostname: string; status: string;
  records: { type: string; name: string; value: string }[];
  dnsOk: boolean | null; sslOk: boolean | null; reachable: boolean | null;
  launchReady?: boolean; statusReason: string | null; cutoverReady: boolean;
};
export type GuideScreen = {
  id: string; title: string; instruction: string;
  kind: "provider" | "login" | "menu" | "add" | "field" | "save" | "check";
  value?: string; field?: string; record?: number;
};

/** Before authorized production activation, only the row's non-routing proof is safe. */
export function visibleGuideRecords(domain: GuideDomain) {
  return domain.cutoverReady ? domain.records : domain.records.filter(record => record.type === "TXT" && record.value.startsWith("vigil-verify="));
}

/** A screen is one task, and a field screen contains exactly one DNS value. */
export function domainGuideScreens(domain: GuideDomain, registrar: RegistrarKey, chooseProvider = true): GuideScreen[] {
  const guide = REGISTRAR_GUIDES[registrar];
  const screens: GuideScreen[] = [];
  if (chooseProvider) screens.push({ id: "provider", kind: "provider", title: "Where do you manage your domain?", instruction: "Choose the account where you can edit this domain’s DNS records." });
  screens.push({ id: "login", kind: "login", title: `Sign in to ${guide.name}`, instruction: domain.cutoverReady ? "Open your domain account in a new tab. Keep this guide open." : "First, we’ll confirm that you control this domain. This will not change where your website or email goes." });
  guide.dnsPath.forEach((part, index) => screens.push({ id: `menu-${index}`, kind: "menu", title: part.toLowerCase().includes("your domain") || part.includes("next to your domain") ? `Select ${domain.hostname}` : `Open ${part}`, instruction: part.toLowerCase().includes("your domain") || part.includes("next to your domain") ? `Find ${domain.hostname} in your account and select it.` : `In ${guide.name}, select “${part}”.` }));
  visibleGuideRecords(domain).forEach((record, index) => {
    const zone = registrableDomain(domain.hostname);
    const relative = record.name === zone || record.name === "@" ? "@" : record.name.endsWith(`.${zone}`) ? record.name.slice(0, -zone.length - 1) : record.name;
    const name = relative === "@" ? guide.apexName : relative;
    screens.push({ id: `record-${index}-add`, kind: "add", record: index, title: "Open a DNS record", instruction: record.type === "TXT" ? "Select Add record. Keep existing TXT and email records." : `For the ${record.type} record named ${name || "(blank)"}, edit the matching website record if it exists, or select Add record. If it serves an existing live website and you are unsure, ask Vigil for help before changing it.` });
    screens.push({ id: `record-${index}-type`, kind: "field", record: index, title: "Choose the record type", instruction: "Select this type in the DNS form.", field: "Type", value: record.type });
    screens.push({ id: `record-${index}-name`, kind: "field", record: index, title: "Enter the record name", instruction: name ? `Copy this into the “${guide.fields.name}” field.` : `Leave the “${guide.fields.name}” field empty.`, field: guide.fields.name, value: name });
    const valueField = guide.fields.valueByType?.[record.type.toUpperCase()] ?? guide.fields.value;
    screens.push({ id: `record-${index}-value`, kind: "field", record: index, title: "Enter the record value", instruction: `Copy this into the “${valueField}” field.`, field: valueField, value: record.value });
    if (registrar === "cloudflare" && record.type !== "TXT") screens.push({ id: `record-${index}-proxy`, kind: "menu", record: index, title: "Choose DNS only", instruction: "Set this record’s Proxy status to DNS only." });
    screens.push({ id: `record-${index}-save`, kind: "save", record: index, title: "Save this record", instruction: `Leave ${guide.fields.ttl ?? "the other settings"} at its default and select Save. Keep unrelated records, email settings and nameservers unchanged.` });
  });
  screens.push({ id: "check", kind: "check", title: "Check your setup", instruction: "We’ll check the records you saved. This can take time to appear." });
  return screens;
}

/** Local navigation only. Changing a record/provider invalidates an old cursor. */
export function guideStorageKey(domain: GuideDomain, registrar: RegistrarKey): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(visibleGuideRecords(domain))) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `vigil:domain-guide:${domain.domainId}:${registrar}:${hash >>> 0}`;
}
export function restoreGuideScreen(screens: GuideScreen[], stored: string | null): string {
  return screens.some(screen => screen.id === stored) ? stored! : screens[0].id;
}

export function guideOutcome(domain: GuideDomain): "connected" | "waiting_launch" | "waiting_connection" | "preparing" | null {
  if (domain.status === "connected" && domain.dnsOk && domain.sslOk && domain.reachable) return "connected";
  if (!domain.cutoverReady && domain.launchReady && domain.dnsOk) return "waiting_launch";
  if (domain.cutoverReady && domain.dnsOk) return "waiting_connection";
  if (visibleGuideRecords(domain).length === 0) return "preparing";
  return null;
}
