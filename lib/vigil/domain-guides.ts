import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";

/**
 * Registrar walkthroughs for connecting a domain the customer already owns
 * (master architecture §6, Flow B). Pure data so wording, menu paths and
 * links can be corrected without touching the wizard. The DNS records
 * themselves come from `domains.verification.required_records`; the guide
 * only explains where to put them.
 */
export type RegistrarGuide = {
  key: RegistrarKey;
  name: string;
  /** Where to sign in. */
  loginUrl: string;
  /** Menu breadcrumb from the account home to the DNS editor. */
  dnsPath: string[];
  /** What this registrar calls the record fields. */
  fields: { name: string; value: string; ttl?: string };
  /** How the registrar wants the root domain written in the name field. */
  apexName: string;
  /** Anything specific worth knowing before adding records. */
  before?: string[];
  /** What to remove if something is already there. */
  conflicts: string;
  /** After saving. */
  after?: string;
  /** The registrar's own help article, for the customer's reference. */
  helpUrl?: string;
  /** Nameserver suffixes that identify this registrar's default DNS. */
  nameservers: string[];
};

export const REGISTRAR_GUIDES: Record<RegistrarKey, RegistrarGuide> = {
  godaddy: {
    key: "godaddy",
    name: "GoDaddy",
    loginUrl: "https://sso.godaddy.com/",
    dnsPath: ["My Products", "Domains", "your domain", "DNS"],
    fields: { name: "Name", value: "Value", ttl: "TTL" },
    apexName: "@",
    before: ["If GoDaddy shows a “Website” or “Forwarding” section pointing at a GoDaddy site builder, turn that off first; it overrides DNS."],
    conflicts: "Delete any existing A record with the name “@” and any CNAME with the name “www” before adding the new ones. GoDaddy adds a “Parked” A record by default; remove it.",
    after: "Changes usually show within an hour on GoDaddy, occasionally up to 48 hours.",
    helpUrl: "https://www.godaddy.com/help/manage-dns-records-680",
    nameservers: ["domaincontrol.com"],
  },
  namecheap: {
    key: "namecheap",
    name: "Namecheap",
    loginUrl: "https://www.namecheap.com/myaccount/login/",
    dnsPath: ["Domain List", "Manage (next to your domain)", "Advanced DNS"],
    fields: { name: "Host", value: "Value", ttl: "TTL" },
    apexName: "@",
    before: ["On the Domain tab, make sure Nameservers is set to “Namecheap BasicDNS”. If it says “Custom DNS”, your records live elsewhere; pick that provider from the list instead."],
    conflicts: "Remove the default “URL Redirect Record” for “@” and any “CNAME Record” for “www” that points at parkingpage.namecheap.com.",
    after: "Namecheap applies changes within about 30 minutes.",
    helpUrl: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/",
    nameservers: ["registrar-servers.com"],
  },
  squarespace: {
    key: "squarespace",
    name: "Squarespace Domains (formerly Google Domains)",
    loginUrl: "https://account.squarespace.com/domains",
    dnsPath: ["Domains", "your domain", "DNS", "DNS settings", "Custom records"],
    fields: { name: "Host", value: "Data", ttl: "TTL" },
    apexName: "@",
    before: ["If you moved here from Google Domains, everything is now under account.squarespace.com; the old Google Domains site redirects there."],
    conflicts: "Delete any Squarespace-managed “A” records for “@” (they point at 198.185.159.x / 198.49.23.x) and the “www” CNAME that points at ext-cust.squarespace.com.",
    after: "Squarespace usually updates within a few minutes.",
    helpUrl: "https://support.squarespace.com/hc/en-us/articles/360002101888",
    nameservers: ["squarespacedns.com", "googledomains.com"],
  },
  cloudflare: {
    key: "cloudflare",
    name: "Cloudflare",
    loginUrl: "https://dash.cloudflare.com/login",
    dnsPath: ["your domain", "DNS", "Records"],
    fields: { name: "Name", value: "IPv4 address / Target", ttl: "TTL" },
    apexName: "@",
    before: ["Set the proxy status (the orange cloud) to “DNS only” on the records you add, so the certificate can be issued. You can switch it back later if you want."],
    conflicts: "Edit any existing A record for “@” or CNAME for “www” to the new values rather than adding duplicates.",
    after: "Cloudflare changes are effectively instant.",
    helpUrl: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
    nameservers: ["ns.cloudflare.com"],
  },
  wix: {
    key: "wix",
    name: "Wix",
    loginUrl: "https://manage.wix.com/account/domains",
    dnsPath: ["Domains", "… (next to your domain)", "Manage DNS records"],
    fields: { name: "Host name", value: "Value", ttl: "TTL" },
    apexName: "(leave blank)",
    before: ["Wix only lets you edit DNS for a domain you bought from Wix. If the domain was connected to Wix from elsewhere, go to the company you bought it from."],
    conflicts: "Wix pre-fills A records pointing at 185.230.63.x and a “www” CNAME pointing at cdn1.wixdns.net; replace them.",
    after: "Wix changes can take a few hours.",
    helpUrl: "https://support.wix.com/en/article/adding-or-updating-a-records-in-your-wix-account",
    nameservers: ["wixdns.net"],
  },
  bluehost: {
    key: "bluehost",
    name: "Bluehost",
    loginUrl: "https://my.bluehost.com/",
    dnsPath: ["Domains", "your domain", "DNS"],
    fields: { name: "Host Record", value: "Points To", ttl: "TTL" },
    apexName: "@",
    conflicts: "Delete the existing A record for “@” that points at your Bluehost server and any “www” CNAME.",
    after: "Bluehost changes usually take 1–4 hours.",
    helpUrl: "https://www.bluehost.com/help/article/dns-management-add-edit-or-delete-dns-entries",
    nameservers: ["bluehost.com"],
  },
  ionos: {
    key: "ionos",
    name: "IONOS",
    loginUrl: "https://my.ionos.com/",
    dnsPath: ["Domains & SSL", "your domain", "DNS"],
    fields: { name: "Host name", value: "Points to", ttl: "TTL" },
    apexName: "@",
    conflicts: "Delete the default A record for “@” and the “www” CNAME that IONOS created.",
    after: "IONOS applies changes within about an hour.",
    helpUrl: "https://www.ionos.com/help/domains/configuring-your-ip-address/changing-a-domains-ip-address-a-record/",
    nameservers: ["ui-dns.com", "ui-dns.org", "ui-dns.de", "ui-dns.biz"],
  },
  hover: {
    key: "hover",
    name: "Hover",
    loginUrl: "https://www.hover.com/signin",
    dnsPath: ["Domains", "your domain", "DNS"],
    fields: { name: "Hostname", value: "Target", ttl: "TTL" },
    apexName: "@",
    conflicts: "Delete Hover's default A record for “@” and the “www” CNAME that points at your Hover parking page.",
    after: "Hover changes usually show within an hour.",
    helpUrl: "https://help.hover.com/hc/en-us/articles/217282457-Managing-DNS-records",
    nameservers: ["hover.com"],
  },
  other: {
    key: "other",
    name: "Another provider",
    loginUrl: "",
    dnsPath: ["your domain", "DNS settings (sometimes called “DNS management”, “Zone editor” or “Advanced DNS”)"],
    fields: { name: "Name (or Host)", value: "Value (or Points to / Target)", ttl: "TTL" },
    apexName: "@ (some providers want it blank, or the full domain)",
    conflicts: "If a record with the same type and name already exists, change it to the new value instead of adding a second one.",
    after: "Most providers apply changes within an hour; the maximum is 48 hours.",
    nameservers: [],
  },
};

export const REGISTRAR_OPTIONS: { key: RegistrarKey; name: string }[] = [
  { key: "godaddy", name: "GoDaddy" },
  { key: "namecheap", name: "Namecheap" },
  { key: "squarespace", name: "Squarespace / Google Domains" },
  { key: "cloudflare", name: "Cloudflare" },
  { key: "wix", name: "Wix" },
  { key: "bluehost", name: "Bluehost" },
  { key: "ionos", name: "IONOS" },
  { key: "hover", name: "Hover" },
  { key: "other", name: "Somewhere else / not sure" },
];

/** Match a nameserver hostname to a registrar from the guide table. */
export function registrarFromNameservers(nameservers: string[]): RegistrarKey | null {
  const lower = nameservers.map((n) => n.toLowerCase().replace(/\.$/, ""));
  for (const guide of Object.values(REGISTRAR_GUIDES)) {
    for (const suffix of guide.nameservers) {
      if (lower.some((n) => n === suffix || n.endsWith(`.${suffix}`))) return guide.key;
    }
  }
  return null;
}

/** Plain-language gloss for record types, shown next to the table. */
export const RECORD_TYPE_HELP: Record<string, string> = {
  A: "An A record points your main domain (the part without www) at Vigil's servers.",
  AAAA: "An AAAA record is the same as an A record, for the newer IPv6 address format.",
  CNAME: "A CNAME record points a name like www at another name, so www.yourdomain.com follows your main site.",
  TXT: "A TXT record holds a short piece of text; here it just proves to Vigil that you control the domain.",
};
