import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DomainGuide } from "@/components/vigil/DomainGuide";
import { domainGuideScreens, guideOutcome, guideStorageKey, restoreGuideScreen, visibleGuideRecords, type GuideDomain } from "../domain-guide-flow";
import { guidedDomainRecords } from "../services/dns";
import { normalizeHostname } from "../services/domain";
const domain: GuideDomain = { domainId: "domain-a", hostname: "example.com", status: "pending", records: [{type:"TXT",name:"_vigil",value:"vigil-verify=proof"},{type:"CNAME",name:"www",value:"unique.vercel-dns-017.com"}], dnsOk:false,sslOk:false,reachable:false,cutoverReady:false,statusReason:null };

describe("one task per guided screen", () => {
  it("renders only the provider question, without later instructions or values", () => {
    const html=renderToStaticMarkup(<DomainGuide domain={domain} registrar="vercel" onRegistrarChange={()=>{}} />);
    expect(html).toContain("Where do you manage your domain?");
    expect(html).not.toContain("vigil-verify=proof");expect(html).not.toContain("unique.vercel");expect(html).not.toContain("Open DNS Records");expect(html).not.toContain("Connection progress");
  });
  it("combines Type, Name, Value and saving into one task per record", () => {
    const screens=domainGuideScreens({...domain,cutoverReady:true},"vercel");
    const records=screens.filter(screen=>screen.kind==="record");
    expect(records).toHaveLength(2);expect(records.map(screen=>screen.fields?.map(field=>field.value))).toEqual([["TXT","_vigil","vigil-verify=proof"],["CNAME","www","unique.vercel-dns-017.com"]]);
    expect(records.map(screen=>screen.record)).toEqual([0,1]);
    expect(screens.some(screen=>screen.id.endsWith("-save") || screen.id.endsWith("-value"))).toBe(false);
  });
  it("splits provider navigation into separate actions", () => {
    expect(domainGuideScreens(domain,"vercel").filter(screen=>screen.kind==="menu").map(screen=>screen.title)).toEqual(["Open Domains","Select example.com","Open DNS Records"]);
  });
  it("continues a Vercel purchase directly at Domains, without provider or login questions", () => {
    const screens = domainGuideScreens(domain, "vercel", true, true);
    expect(screens[0].id).toBe("menu-0");
    expect(screens.some(screen => screen.kind === "provider" || screen.kind === "login")).toBe(false);
    expect(screens[0].instruction).toContain("Now that you’ve bought example.com");
    const html = renderToStaticMarkup(<DomainGuide domain={domain} registrar="vercel" afterPurchase onRegistrarChange={() => {}} />);
    expect(html).toContain("Open my Vercel domains"); expect(html).toContain("simplified illustration");
    expect(html).not.toContain("Sign in to Vercel"); expect(html).not.toContain("Where do you manage"); expect(html).not.toContain("vigil-verify=proof");
    expect(domainGuideScreens(domain, "other", true, true)[0].kind).toBe("provider");
  });
  it("withholds all routing records before production activation", () => {
    expect(visibleGuideRecords(domain)).toEqual([domain.records[0]]);
    expect(guidedDomainRecords("example.com",{source:"platform",required_records:domain.records},"proof")).toEqual([domain.records[0]]);
  });
  it("cannot turn Next clicks, launch readiness or partial checks into connection success", () => {
    expect(guideOutcome({...domain,status:"connected",dnsOk:true,sslOk:false,reachable:true})).not.toBe("connected");
    expect(guideOutcome({...domain,launchReady:true,dnsOk:true})).toBe("waiting_launch");
    expect(guideOutcome({...domain,cutoverReady:true,status:"connected",dnsOk:true,sslOk:true,reachable:true})).toBe("connected");
  });
  it("shows only the waiting message after proof, with no cutover instructions", () => {
    const html=renderToStaticMarkup(<DomainGuide domain={{...domain,launchReady:true,dnsOk:true}} registrar="vercel" />);
    expect(html).toContain("Your domain is ready for launch");expect(html).not.toContain("Select this type");expect(html).not.toContain("unique.vercel");
  });
  it("restores only valid cursors and invalidates progress when domain, provider or records change", () => {
    const screens=domainGuideScreens(domain,"vercel");expect(restoreGuideScreen(screens,"record-0")).toBe("record-0");expect(restoreGuideScreen(screens,"record-0-value")).toBe("provider");
    const key=guideStorageKey(domain,"vercel");
    expect(guideStorageKey({...domain,domainId:"domain-b"},"vercel")).not.toBe(key);
    expect(guideStorageKey(domain,"other")).not.toBe(key);
    expect(guideStorageKey({...domain,records:[{...domain.records[0],value:"vigil-verify=new"}]},"vercel")).not.toBe(key);
    expect(guideStorageKey({...domain,cutoverReady:true},"vercel")).not.toBe(key);
    expect(guideStorageKey(domain,"vercel",true)).not.toBe(key);
  });
  it("keeps the last check retryable rather than disabling it forever during verification", () => {
    const screens=domainGuideScreens(domain,"vercel");expect(screens.at(-1)?.kind).toBe("check");expect(restoreGuideScreen(screens,"check")).toBe("check");
  });
  it("normalizes purchased IDNs for the owned setup route and rejects account/port input", () => {
    expect(normalizeHostname("例え.テスト")).toBe("xn--r8jz45g.xn--zckzah");expect(normalizeHostname("user@example.com")).toBeNull();expect(normalizeHostname("example.com:443")).toBeNull();
  });
});

describe("record names and verified state", () => {
  it("turns provider FQDN challenges into the relative name required by DNS forms", () => {
    const screens=domainGuideScreens({...domain,cutoverReady:true,records:[{type:"TXT",name:"_vercel.example.com",value:"challenge"}]},"vercel");
    expect(screens.find(screen=>screen.id==="record-0")?.fields?.find(field=>field.label==="Name")?.value).toBe("_vercel");
  });
  it("keeps a nested subdomain rather than presenting it as the zone apex", () => {
    const screens=domainGuideScreens({...domain,hostname:"shop.eu.example.com",cutoverReady:true,records:[{type:"CNAME",name:"shop.eu.example.com",value:"target.vercel-dns.com"}]},"vercel");
    expect(screens.find(screen=>screen.id==="record-0")?.fields?.find(field=>field.label==="Name")?.value).toBe("shop.eu");
  });
  it("does not ask the user to enter an already verified ownership proof again at cutover", () => {
    expect(guidedDomainRecords("example.com",{source:"provider",required_records:domain.records,checks:[{type:"TXT",name:"_vigil",ok:true,found:["vigil-verify=proof"]}]},"proof")).toEqual([domain.records[1]]);
  });
  it("shows a single waiting phase while SSL/site verification is unfinished", () => {
    expect(guideOutcome({...domain,cutoverReady:true,dnsOk:true,sslOk:false})).toBe("waiting_connection");
  });
});

it("requires the exact TXT proof, preserving case and punctuation",async()=>{
  const {checkDnsRecords}=await import("../services/dns");
  const result=await checkDnsRecords("example.com",[{type:"TXT",name:"_vigil",value:"vigil-verify=abc"}],{resolve4:async()=>[],resolve6:async()=>[],resolveCname:async()=>[],resolveTxt:async()=>[["VIGIL-VERIFY=ABC."]]});expect(result[0].ok).toBe(false);
});
