"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrgContextOrThrow, requireStaff } from "@/lib/vigil/auth/session";
import { ForbiddenError, ValidationError, toActionError, type ActionResult } from "@/lib/vigil/auth/errors";
import { leadStatuses, validBookingUrl } from "@/lib/vigil/contact/contract";

export async function updateLead(id: string, form: FormData): Promise<ActionResult> {
  try {
    const ctx=await requireOrgContextOrThrow(), client=await createClient();
    const parsed=z.object({status:z.enum(leadStatuses),read:z.enum(["read","unread"])}).parse(Object.fromEntries(form));
    const {data,error}=await client.from("leads").update({status:parsed.status,read_at:parsed.read==="read"?new Date().toISOString():null})
      .eq("id",z.string().uuid().parse(id)).eq("organization_id",ctx.organization.id).select("id").maybeSingle();
    if(error)throw error; if(!data)throw new ForbiddenError();
    revalidatePath("/dashboard/leads");return {ok:true,data:undefined};
  } catch(error){return toActionError(error);}
}
export async function addLeadNote(id: string, form: FormData): Promise<ActionResult> {
  try {
    const ctx=await requireOrgContextOrThrow(),client=await createClient();
    const {data:lead,error:lookup}=await client.from("leads").select("id").eq("id",z.string().uuid().parse(id)).eq("organization_id",ctx.organization.id).maybeSingle();
    if(lookup)throw lookup;if(!lead)throw new ForbiddenError();
    const {error}=await client.rpc("add_lead_note",{p_lead:id,p_note:z.string().trim().min(1).max(4000).parse(form.get("note"))});
    if(error)throw error;revalidatePath("/dashboard/leads");return {ok:true,data:undefined};
  }catch(error){return toActionError(error);}
}
function preferences(form: FormData) {
 const recipient=z.string().trim().email().max(254).parse(form.get("recipient"));
 const booking=String(form.get("booking")??"").trim();
 if(booking&&!validBookingUrl(booking))throw new ValidationError("Use a public HTTPS booking link.");
 return {recipient,booking:booking||null};
}
export async function saveLeadPreferences(websiteId:string,form:FormData):Promise<ActionResult>{
 try{
  const ctx=await requireOrgContextOrThrow();
  if(!ctx.staffRole&&!['owner','manager'].includes(ctx.role))throw new ForbiddenError("An owner or manager must change notification settings.");
  const client=await createClient(),v=preferences(form);
  const {data,error:lookup}=await client.from("websites").select("id").eq("id",z.string().uuid().parse(websiteId)).eq("organization_id",ctx.organization.id).maybeSingle();
  if(lookup)throw lookup;if(!data)throw new ForbiddenError();
  const {error}=await client.rpc("configure_website_contact",{p_website:websiteId,p_recipient:v.recipient,p_booking:v.booking??undefined});
  if(error)throw error;revalidatePath("/dashboard/leads");return {ok:true,data:undefined};
 }catch(error){return toActionError(error);}
}
export async function registerWebsiteContact(websiteId:string,form:FormData):Promise<ActionResult>{
 try{
  await requireStaff();const client=await createClient(),v=preferences(form);
  const id=z.string().uuid().parse(websiteId);
  const {error}=await client.rpc("configure_website_contact",{p_website:id,p_recipient:v.recipient,p_booking:v.booking??undefined});
  if(error)throw new ValidationError("Contact preferences could not be saved.");
  revalidatePath(`/admin/websites/${websiteId}/contact`);revalidatePath("/dashboard/leads");return {ok:true,data:undefined};
 }catch(error){return toActionError(error);}
}
export async function setContactAutomation(websiteId:string,form:FormData):Promise<ActionResult>{
 try{
  await requireStaff();const client=await createClient();
  const {error}=await client.rpc("set_website_contact_automation",{p_website:z.string().uuid().parse(websiteId),p_automatic:z.enum(["automatic","paused"]).parse(form.get("mode"))==="automatic"});
  if(error)throw new ValidationError("Contact automation could not be updated.");
  revalidatePath(`/admin/websites/${websiteId}/contact`);revalidatePath("/dashboard/leads");return {ok:true,data:undefined};
 }catch(error){return toActionError(error);}
}
