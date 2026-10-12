import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader, inputClass, labelClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { registerWebsiteContact,setContactAutomation } from "@/lib/vigil/actions/leads";
import { contactConnectionReady } from "@/lib/vigil/contact/cloudflare";
export default async function WebsiteContactPage({params}:{params:Promise<{websiteId:string}>}){
 await requireStaff();const {websiteId}=await params;if(!z.string().uuid().safeParse(websiteId).success)notFound();
 const client=await createClient();const [{data:website,error},{data:settings,error:settingsError},{data:automation,error:automationError}]=await Promise.all([
 client.from('websites').select('id,name,status,live_url').eq('id',websiteId).maybeSingle(),client.from('website_contact_settings').select('*').eq('website_id',websiteId).maybeSingle(),client.from('website_contact_automation').select('*').eq('website_id',websiteId).maybeSingle()]);
 if(error)throw error;if(settingsError)throw settingsError;if(automationError)throw automationError;if(!website)notFound();
 return <div><Link className="underline text-sm" href={`/admin/websites/${websiteId}`}>← Website</Link><PageHeader title={`${website.name} contact & booking`} description="Contact setup follows website approval and verified domains automatically."/>
 <Card><h2 className="font-semibold">Automatic contact setup</h2><p className="mt-2 text-sm">Website: {website.status}. Setup: {(automation?.status??'waiting_launch').replaceAll('_',' ')}. Submissions: {settings?.enabled?'active':'inactive'}.</p>
 <p className="mt-2 text-sm">{contactConnectionReady()?'Cloudflare and email connection settings are present. Provider access is verified during setup.':'One-time connection needed: add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_TURNSTILE_API_TOKEN with account-scoped Turnstile Sites Write permission to Vercel Production. Resend must also be configured. Redeploy after connecting.'}</p>
 {automation?.last_error&&<p className="mt-2 text-sm" role="status">{automation.last_error}</p>}
 <p className="mt-2 text-sm">Approved live websites get a managed widget for their verified production hostnames. Domain changes update the same widget. An interrupted creation requires recovery before another widget can be created.</p>
 <ActionForm action={setContactAutomation.bind(null,websiteId)} submitLabel="Save automation mode" className="mt-4 space-y-3"><label className={labelClass} htmlFor="mode">Contact automation</label><select id="mode" name="mode" defaultValue={automation?.automatic===false?'paused':'automatic'} className={inputClass}><option value="automatic">Automatic / retry setup</option><option value="paused">Paused — disable submissions</option></select></ActionForm></Card>
 <Card className="mt-5"><h2 className="font-semibold">Client notification and booking</h2>
 <p className="mt-2 text-sm">Last configured production origins: {settings?.allowed_origins.join(', ')||'Assigned after approved launch.'}</p>
 <ActionForm action={registerWebsiteContact.bind(null,websiteId)} submitLabel="Save preferences" className="mt-5 space-y-4">
 <div><label className={labelClass} htmlFor="recipient">Client notification email</label><input id="recipient" name="recipient" type="email" required maxLength={254} defaultValue={settings?.notification_email??''} className={inputClass}/></div>
 <div><label className={labelClass} htmlFor="booking">Booking link (optional)</label><input id="booking" name="booking" type="url" maxLength={2048} defaultValue={settings?.booking_url??''} className={inputClass}/></div></ActionForm>
 <p className="mt-5 text-sm">Website integration ID: <code>{website.id}</code></p><p className="mt-2 text-sm">Published sites send inquiries into Lead Hub. Template and Lab previews simulate submissions and send nothing. Booking links open the client’s scheduler; they do not confirm appointments.</p></Card></div>;
}
