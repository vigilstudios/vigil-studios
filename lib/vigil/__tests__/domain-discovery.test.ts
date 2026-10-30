import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import { NextRequest } from "next/server";
import { FakeAdmin } from "./fake-admin";
import { liveOrg,liveWebsite,liveOrder,livePolicy } from "./domain-live-fixture";
import { namecomAccountScope } from "../domain-engine/namecom-production";
const state=vi.hoisted(()=>({db:null as unknown,search:vi.fn(),rate:vi.fn(),impersonating:true}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>state.db}));
vi.mock("../auth/session",()=>({requireOrgContextOrThrow:async()=>({organization:{id:liveOrg},user:{id:liveOrder},isImpersonating:state.impersonating})}));
vi.mock("../rate-limit",()=>({enforceRateLimit:state.rate}));
vi.mock("../domain-engine/discovery",()=>({discoverProductionDomains:state.search}));
import { POST } from "@/app/api/domain-engine/discovery/route";
import { getDomainLaunchProfile,ensureDomainWebsitePolicy } from "../domain-engine/launch-profile";
const request=(body:unknown,origin="https://vigil.example.com")=>new NextRequest("https://vigil.example.com/api/domain-engine/discovery",{method:"POST",headers:{host:"vigil.example.com",origin},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("VIGIL_DOMAIN_ENGINE_ENABLED","true");vi.stubEnv("VIGIL_DOMAIN_SEARCH_ENABLED","true");vi.stubEnv("VIGIL_DOMAIN_REGISTRAR","namecom");vi.stubEnv("VIGIL_NAMECOM_USERNAME","fixture");vi.stubEnv("VIGIL_DOMAIN_STRIPE_ACCOUNT_ID","acct_fixture");state.db=new FakeAdmin({websites:[{id:liveWebsite,organization_id:liveOrg}]}).asClient();state.search.mockResolvedValue([{fqdn:"fixture.com",availability:"available",registration:{amountMinor:1700,currency:"usd"},taxPending:true}]);});
afterEach(()=>vi.unstubAllEnvs());
describe("read-only client discovery",()=>{
 it("allows staff preview without financial consent or creating an order",async()=>{const r=await POST(request({action:"search",websiteId:liveWebsite,input:"fixture"}));expect(r.status).toBe(200);expect(r.headers.get("cache-control")).toBe("no-store");expect(state.search).toHaveBeenCalledWith(state.db,"fixture",false);});
 it.each(["purchase","tax_quote","reconcile","resume_checkout"])("cannot perform %s",async action=>{expect((await POST(request({action,websiteId:liveWebsite}))).status).toBe(400);expect(state.search).not.toHaveBeenCalled();});
 it("denies cross-origin and cross-tenant website access before registrar calls",async()=>{expect((await POST(request({action:"search",websiteId:liveWebsite},"https://attacker.test"))).status).toBe(403);expect((await POST(request({action:"search",websiteId:liveOrder}))).status).toBe(404);expect(state.search).not.toHaveBeenCalled();});
 it("rechecks availability when selecting a quote",async()=>{state.search.mockResolvedValue([{fqdn:"fixture.com",availability:"unavailable",registration:null}]);expect((await POST(request({action:"quote",websiteId:liveWebsite,fqdn:"fixture.com"}))).status).toBe(409);});
 it("does not reveal policy evidence or allow customer-supplied prices",async()=>{expect((await POST(request({action:"quote",websiteId:liveWebsite,fqdn:"fixture.com",totalMinor:1}))).status).toBe(400);});
});
function profile() {const p=livePolicy();return {...p,id:p.id,registrar_scope:namecomAccountScope("fixture","live"),allowed_country:"US",purchasing_enabled:false,tax_code:null,fee_tax_code:null,tax_review_reference:null,supplier_tax_reference:null,retention_days:2557,revoked_at:null as string|null};}
describe("merchant launch profile",()=>{
 it("can expose discovery without admitting any customer purchasing policy",async()=>{const db=new FakeAdmin(),rpc=vi.spyOn(db,"rpc").mockResolvedValue({data:profile(),error:null} as never);expect(await getDomainLaunchProfile(db.asClient())).toMatchObject({purchasing_enabled:false});await expect(ensureDomainWebsitePolicy(db.asClient(),liveOrg,liveWebsite,liveOrder)).rejects.toThrow();expect(rpc.mock.calls.every(([name])=>name==="domain_launch_profile")).toBe(true);});
 it.each(["account","registrar","expired","invalid_date","revoked","http"])("rejects invalid release binding: %s",async kind=>{const p=profile();if(kind==="account")p.stripe_account="acct_other";if(kind==="registrar")p.registrar_scope=namecomAccountScope("other","live");if(kind==="expired")p.valid_until="2020-01-01T00:00:00Z";if(kind==="invalid_date")p.valid_until="bad";if(kind==="revoked")p.revoked_at=new Date().toISOString();if(kind==="http")p.terms_url="http://example.test/terms";const db=new FakeAdmin();vi.spyOn(db,"rpc").mockResolvedValue({data:p,error:null} as never);expect(await getDomainLaunchProfile(db.asClient())).toBeNull();});
});
