import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {createClient} from '@supabase/supabase-js';
const [websiteId,manifestPath,...flags]=process.argv.slice(2);if(!websiteId||!manifestPath)throw new Error('Usage: node --env-file=.env.local scripts/content-hub-backfill.mjs WEBSITE_ID VERIFIED_MANIFEST.json [--apply]');
const bytes=await readFile(manifestPath),manifest=JSON.parse(bytes);if(!manifest.sourceSha||!Array.isArray(manifest.collections))throw new Error('A verified source SHA and collections are required.');
const compiled=await build({entryPoints:['lib/vigil/content/contract.ts'],bundle:true,platform:'node',format:'cjs',write:false});const schemaPath=`/tmp/vigil-content-schema-${process.pid}.cjs`;await writeFile(schemaPath,compiled.outputFiles[0].contents);const {bindingSchema,parseRecords}=createRequire(import.meta.url)(schemaPath);
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{data:website,error}=await admin.from('websites').select('id,organization_id,status,projects(kind)').eq('id',websiteId).single();if(error)throw error;
if(!['professional','custom'].includes(website.projects.kind)||!['building','live'].includes(website.status))throw new Error('A scoped eligible website is required.');
const {data:staff,error:staffError}=await admin.from('staff_members').select('user_id').eq('role','admin').limit(1).single();if(staffError)throw staffError;
const summary=[];
for(const input of manifest.collections){const binding=bindingSchema.parse(input.binding);if(binding.module==='blog')throw new Error('Existing Blog records must not be reimported.');const records=parseRecords(binding.module,input.records);
 const {data:existing,error:readError}=await admin.from('website_content_collections').select('id,revision,module').eq('website_id',websiteId).eq('key',binding.key).maybeSingle();if(readError)throw readError;if(existing&&existing.module!==binding.module)throw new Error('Existing binding conflict.');
 if(!existing&&flags.includes('--apply')){const {data:c,error:insertError}=await admin.from('website_content_collections').insert({website_id:websiteId,organization_id:website.organization_id,key:binding.key,module:binding.module,label:binding.label,page_id:binding.pageId,section_id:binding.sectionId,field:binding.field,adapter:binding.adapter,config:{...input.config,sourceSha:manifest.sourceSha,manifestSha256:createHash('sha256').update(bytes).digest('hex')},draft:records,published:records,published_revision:1,updated_by:staff.user_id}).select('id').single();if(insertError)throw insertError;
  const {error:auditError}=await admin.from('website_content_history').insert({collection_id:c.id,website_id:websiteId,organization_id:website.organization_id,revision:1,intent:'verified_backfill',records,actor_id:staff.user_id});if(auditError)throw auditError;
 }
 summary.push({key:binding.key,module:binding.module,records:records.length,existingRevision:existing?.revision??null,action:existing?'preserved':flags.includes('--apply')?'imported':'would import'});
}
console.log(JSON.stringify({mode:flags.includes('--apply')?'apply':'dry-run',websiteId,sourceSha:manifest.sourceSha,manifestSha256:createHash('sha256').update(bytes).digest('hex'),collections:summary},null,2));
