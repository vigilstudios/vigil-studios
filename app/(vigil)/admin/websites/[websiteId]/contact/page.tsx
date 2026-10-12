import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm } from "@/components/vigil/ActionControls";
import { Card, PageHeader, inputClass, labelClass } from "@/components/vigil/ui";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { registerWebsiteContact } from "@/lib/vigil/actions/leads";
export default async function WebsiteContactPage({params}:{params:Promise<{websiteId:string}>}){
 await requireStaff();const {websiteId}=await params;if(!z.string().uuid().safeParse(websiteId).success)notFound();
 const client=await createClient();const [{data:website,error},{data:settings,error:settingsError}]=await Promise.all([
 client.from('websites').select('id,name,status,live_url').eq('id',websiteId).maybeSingle(),client.from('website_contact_settings').select('*').eq('website_id',websiteId).maybeSingle()]);
 if(error)throw error;if(settingsError)throw settingsError;if(!website)notFound();
 let origin='';try{origin=website.live_url?new URL(website.live_url).origin:'';}catch{}
 return <div><Link className="underline text-sm" href={`/admin/websites/${websiteId}`}>← Website</Link><PageHeader title={`${website.name} contact & booking`} description="Register the operated website, client notification destination and optional scheduler."/><Card>
 <p className="text-sm">Website status: {website.status}. Contact activation requires a live website, a registered production origin, Turnstile and Resend.</p>
 <ActionForm action={registerWebsiteContact.bind(null,websiteId)} submitLabel="Save integration" className="mt-5 space-y-4">
 <div><label className={labelClass} htmlFor="recipient">Client notification email</label><input id="recipient" name="recipient" type="email" required maxLength={254} defaultValue={settings?.notification_email??''} className={inputClass}/></div>
 <div><label className={labelClass} htmlFor="origins">Verified production origins (one per line)</label><textarea id="origins" name="origins" rows={3} defaultValue={settings?.allowed_origins.join('\n')??origin} className={inputClass}/></div>
 <div><label className={labelClass} htmlFor="booking">Booking link (optional)</label><input id="booking" name="booking" type="url" maxLength={2048} defaultValue={settings?.booking_url??''} className={inputClass}/></div>
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={settings?.enabled??false}/>Activate contact submissions</label></ActionForm>
 <p className="mt-5 text-sm">Website integration ID: <code>{website.id}</code></p><p className="mt-2 text-sm">Published sites use <code>https://www.vigilstudios.co/api/contact/{website.id}</code>. Template and Lab previews simulate submissions and send nothing.</p>
 </Card></div>;
}
