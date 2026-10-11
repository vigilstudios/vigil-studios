import { beforeEach,describe,expect,it,vi } from "vitest";
import { FakeAdmin } from "./fake-admin";
import { ForbiddenError } from "../auth/errors";
import { blankExpressSite } from "../express/document";
const context=vi.hoisted(()=>({client:null as unknown,staff:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>context.client}));
vi.mock("@/lib/vigil/auth/session",()=>({requireStaffOrThrow:context.staff}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import { archiveExpressVariant,createExpressVariant,saveExpressVariant } from "../actions/express-library";
const id="11111111-1111-4111-8111-111111111111";
const base={variant:"Luxe",industry:"Creator",example:"Example",description:"Test",accent:"#bfa483",kind:"site" as const,site:blankExpressSite(id,"Original")};
let db:FakeAdmin;
beforeEach(()=>{db=new FakeAdmin({express_variants:[{id,slug:"creator",draft:base,published:base,revision:1,published_revision:1,archived_at:null}]});context.client=db.asClient();context.staff.mockReset().mockResolvedValue({user:{id:"staff"}});});
describe("Express catalog actions",()=>{
 it("saves drafts without replacing the public snapshot and rejects stale writes",async()=>{
  const changed={...base,variant:"Draft name",site:{...base.site,title:"Edited"}};
  expect(await saveExpressVariant(id,1,changed)).toMatchObject({ok:true,data:{revision:2,publishedRevision:1}});
  expect(db.rows("express_variants")[0].published).toMatchObject({variant:"Luxe"});
  expect(await saveExpressVariant(id,1,base)).toMatchObject({ok:false});
  expect(context.staff).toHaveBeenCalledTimes(2);
 });
 it("removes and restores recoverably, and blocks saves to removed variants",async()=>{
  expect(await archiveExpressVariant(id,1)).toMatchObject({ok:true});expect(db.rows("express_variants")[0].archived_at).toBeTruthy();
  expect(await saveExpressVariant(id,2,base)).toMatchObject({ok:false});
  expect(await archiveExpressVariant(id,2,true)).toMatchObject({ok:true});expect(db.rows("express_variants")[0]).toMatchObject({archived_at:null,revision:3,published:base});
 });
 it("duplicates into a new isolated draft with a new stable slug",async()=>{
  const result=await createExpressVariant({name:"Editorial",industry:"Creator",duplicateId:id});expect(result.ok).toBe(true);
  if(!result.ok)return;
  const created=db.rows("express_variants")[1];expect(created.slug).not.toBe("creator");expect(created.published).toBeUndefined();
  expect(created.draft).toMatchObject({variant:"Editorial",site:{id:`express-${result.data.id}`}});expect(db.rows("express_variants")[0].draft).toEqual(base);
 });
 it("checks staff authorization before changing data",async()=>{
  context.staff.mockRejectedValue(new ForbiddenError("Not staff"));expect(await saveExpressVariant(id,1,base)).toMatchObject({ok:false});expect(db.rows("express_variants")[0].revision).toBe(1);
 });
});
