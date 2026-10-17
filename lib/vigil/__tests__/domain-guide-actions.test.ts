import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { ForbiddenError } from "../auth/errors";
import type { OrgContext } from "../auth/session";
const mocks=vi.hoisted(()=>({client:{},context:{} as OrgContext,admin:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>mocks.client}));
vi.mock("@/lib/supabase/admin",()=>({hasAdminClient:()=>true,createAdminClient:mocks.admin}));
vi.mock("@/lib/vigil/auth/session",()=>({requireOrgContextOrThrow:async()=>mocks.context,assertOrgRole:async(ctx:OrgContext)=>{if(!["owner","manager"].includes(ctx.role))throw new ForbiddenError("Owner or manager required");}}));
import { saveDomainRegistrar } from "../actions/onboarding";
import type { RegistrarKey } from "../onboarding/brief";

describe("saved guide provider preference",()=>{
  let db:FakeAdmin;
  beforeEach(()=>{
    vi.clearAllMocks();mocks.context={organization:{id:"org-a"},role:"owner"} as OrgContext;
    db=new FakeAdmin({domains:[{id:"domain-a",organization_id:"org-a",hostname:"example.com",registrar:"other",status:"pending",verification_token:"proof",verification:{source:"platform"}}]});mocks.client=db.asClient();mocks.admin.mockReturnValue(db.asClient());
  });
  it("persists the chosen provider without changing DNS or ownership status",async()=>{
    expect(await saveDomainRegistrar("domain-a","vercel")).toMatchObject({ok:true,data:{registrar:"vercel",status:"pending"}});expect(db.rows("domains")[0]).toMatchObject({registrar:"vercel",status:"pending",verification:{source:"platform"}});
  });
  it("rejects another tenant before service-role access",async()=>{
    mocks.context={...mocks.context,organization:{id:"org-b"}} as OrgContext;expect(await saveDomainRegistrar("domain-a","vercel")).toMatchObject({ok:false,code:"not_found"});expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("denies viewer preference writes",async()=>{
    mocks.context={...mocks.context,role:"member"};expect(await saveDomainRegistrar("domain-a","vercel")).toMatchObject({ok:false,code:"forbidden"});expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects inherited or unrecognized provider names",async()=>{
    expect(await saveDomainRegistrar("domain-a","constructor" as RegistrarKey)).toMatchObject({ok:false,code:"validation"});expect(mocks.admin).not.toHaveBeenCalled();
  });
});
