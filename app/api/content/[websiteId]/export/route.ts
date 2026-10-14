import JSZip from 'jszip';
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {requireOrgContextOrThrow,assertOrgRole} from '@/lib/vigil/auth/session';
import {contentExportFiles} from '@/lib/vigil/content/export';
import {isVigilError} from '@/lib/vigil/auth/errors';
import {logAuditEvent} from '@/lib/vigil/audit';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{websiteId:string}>}){
 try{const ctx=await requireOrgContextOrThrow();await assertOrgRole(ctx,['owner','manager']);const website=z.string().uuid().parse((await params).websiteId),client=await createClient(),{data:site,error}=await client.from('websites').select('id,export_eligible,code_ownership').eq('id',website).eq('organization_id',ctx.organization.id).maybeSingle();if(error)throw error;if(!site)return new Response('Content unavailable.',{status:404});if(!site.export_eligible||site.code_ownership!=='customer_owned')return new Response('Contact Vigil about export access under your agreement.',{status:403});
  const files=await contentExportFiles(client,website,ctx.organization.id),zip=new JSZip();for(const file of files)zip.file(file.path,file.content);const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
  await logAuditEvent(client,{action:'content.exported',entityType:'website',entityId:website,organizationId:ctx.organization.id,metadata:{files:files.length}});
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="website-content.zip"','Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:isVigilError(error)?error.message:'The content export could not load. Please try again.'},{status:isVigilError(error)?error.status:503});}
}
