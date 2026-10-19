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
  kind: "provider" | "login" | "menu" | "add" | "record" | "check";
  record?: number;
  fields?: { label: string; value: string }[];
  dnsOnly?: boolean;
};

/** Before authorized production activation, only the row's non-routing proof is safe. */
export function visibleGuideRecords(domain: GuideDomain) {
  return domain.cutoverReady ? domain.records : domain.records.filter(record => record.type === "TXT" && record.value.startsWith("vigil-verify="));
}

/** One task per screen; filling and saving one DNS record is one task. */
export function domainGuideScreens(domain: GuideDomain, registrar: RegistrarKey, chooseProvider = true, afterPurchase = false): GuideScreen[] {
  const guide = REGISTRAR_GUIDES[registrar];
  const continuingPurchase = afterPurchase && registrar === "vercel";
  // Final connection resumes at the next record, including after a reload.
  // Ownership has already been checked; repeating account navigation obscures
  // the fact that these are additional records in the same setup.
  const connecting = domain.cutoverReady;
  const screens: GuideScreen[] = [];
  if (chooseProvider && !continuingPurchase && !connecting) screens.push({ id: "provider", kind: "provider", title: "Where do you manage your domain?", instruction: "Choose the account where you can edit this domain’s DNS records." });
  if (!continuingPurchase && !connecting) screens.push({ id: "login", kind: "login", title: `Sign in to ${guide.name}`, instruction: "First, we’ll confirm that you control this domain. This will not change where your website or email goes." });
  if (!connecting) guide.dnsPath.forEach((part, index) => screens.push({ id: `menu-${index}`, kind: "menu", title: part.toLowerCase().includes("your domain") || part.includes("next to your domain") ? `Select ${domain.hostname}` : `Open ${part}`, instruction: continuingPurchase && index === 0 ? `Now that you’ve bought ${domain.hostname} on Vercel, open Domains in the same account. Keep this guide open in another tab.` : part.toLowerCase().includes("your domain") || part.includes("next to your domain") ? `Find ${domain.hostname} in your account and select it.${continuingPurchase ? " If it is missing, check the account or team you used for the purchase." : ""}` : registrar === "vercel" && index === 2 ? "On your domain’s settings page, find the DNS Records section. This is where you’ll add the record in the next step." : `In ${guide.name}, select “${part}”.` }));
  visibleGuideRecords(domain).forEach((record, index) => {
    const zone = registrableDomain(domain.hostname);
    const relative = record.name === zone || record.name === "@" ? "@" : record.name.endsWith(`.${zone}`) ? record.name.slice(0, -zone.length - 1) : record.name;
    const name = relative === "@" ? guide.apexName : relative;
    if (registrar !== "vercel") screens.push({ id: `record-${index}-add`, kind: "add", record: index, title: "Open a DNS record", instruction: "Select Add record, or open the matching record if you are updating it. Keep existing TXT and email records." });
    const valueField = guide.fields.valueByType?.[record.type.toUpperCase()] ?? guide.fields.value;
    const sharedName = visibleGuideRecords(domain).some((other, otherIndex) => otherIndex !== index && other.type === "TXT" && other.name === record.name);
    screens.push({ id: `record-${index}`, kind: "record", record: index, title: record.type === "TXT" ? connecting ? "Add your connection verification record" : "Add your ownership verification record" : "Save your website record", instruction: record.type === "TXT" ? `Fill in this one record in ${guide.name}. ${connecting ? "This additional record allows your domain to connect to the website Vigil prepared." : "It proves you control your domain without changing your website or email."}${sharedName ? " Add a separate TXT record for each value, even when the Name is the same. Keep the earlier TXT records." : ""}` : `Use these values for the ${record.type} record named ${name || "(blank)"}. Edit the matching website record if it exists. If it serves a live website and you are unsure, contact Vigil before changing it.`, fields: [{ label: "Type", value: record.type }, { label: guide.fields.name, value: name }, { label: valueField, value: record.value }], dnsOnly: registrar === "cloudflare" && record.type !== "TXT" });
  });
  screens.push({ id: "check", kind: "check", title: connecting ? "Check your final connection" : "Verify your domain ownership", instruction: connecting ? "We’ll check all your records, the secure connection and that your domain opens the correct website. Keep this page open while we check." : "We’ll check your ownership record first. Keep this page open while we verify it. You’ll add the remaining connection records afterward; this is not the last step." });
  return screens;
}

/** Local navigation only. Changing a record/provider invalidates an old cursor. */
export function guideStorageKey(domain: GuideDomain, registrar: RegistrarKey, afterPurchase = false): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(visibleGuideRecords(domain))) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `vigil:domain-guide:v3:${domain.domainId}:${registrar}:${domain.cutoverReady ? "connection" : "ownership"}:${afterPurchase && registrar === "vercel" ? "purchase" : "own"}:${hash >>> 0}`;
}
export function restoreGuideScreen(screens: GuideScreen[], stored: string | null): string {
  return screens.some(screen => screen.id === stored) ? stored! : screens[0].id;
}

/** Encouragement describes the guide, never infers successful DNS from clicks. */
export function guideEncouragement(screen: GuideScreen): string {
  if (screen.kind === "record") return "Almost there!";
  if (screen.kind === "check") return "So close — let’s check your setup!";
  if (screen.kind === "provider" || screen.kind === "login") return "You’ve got this. We’ll take it one step at a time.";
  return screen.id === "menu-0" ? "Great start!" : "You’re getting closer!";
}

export function guideOutcome(domain: GuideDomain): "connected" | "waiting_launch" | "waiting_connection" | "preparing" | null {
  if (domain.cutoverReady && domain.status === "connected" && domain.dnsOk && domain.sslOk && domain.reachable) return "connected";
  if (domain.status === "verifying" && !domain.cutoverReady && domain.launchReady && domain.dnsOk) return "waiting_launch";
  if (domain.cutoverReady && domain.dnsOk) return "waiting_connection";
  if (visibleGuideRecords(domain).length === 0) return "preparing";
  return null;
}
