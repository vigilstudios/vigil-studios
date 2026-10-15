import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{createClient}from'@supabase/supabase-js';
import{recoverPrimaryCaptions}from'../lib/vigil/content/caption-backfill.mjs';
const [website,manifestPath,...flags]=process.argv.slice(2);
if(!website||!manifestPath)throw Error('Usage: node --env-file=.env.local scripts/recover-content-captions.mjs WEBSITE VERIFIED_CAPTIONS.json [--apply]');
const bytes=await readFile(manifestPath),manifest=JSON.parse(bytes),hash=createHash('sha256').update(bytes).digest('hex');
if(!/^[a-f0-9]{40}$/.test(manifest.sourceSha)||!manifest.captions||typeof manifest.captions!=='object')throw Error('A reviewed source SHA and caption map are required');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const {data:c,error}=await db.from('website_content_collections').select('*').eq('website_id',website).eq('module','portfolio').eq('adapter','standalone').single();if(error)throw error;
const {data:staff,error:se}=await db.from('staff_members').select('user_id').eq('role','admin').limit(1).single();if(se)throw se;
const applied=Boolean(c.config.primaryCaptionsRecovered);
const draft=applied?{records:c.draft,changes:[]}:recoverPrimaryCaptions(c.draft,manifest.captions),published=applied?{records:c.published,changes:[]}:recoverPrimaryCaptions(c.published,manifest.captions);
const proof={mode:flags.includes('--apply')?'apply':flags.includes('--verify-rollback')?'verify-rollback':'dry-run',website,collection:c.id,expectedRevision:c.revision,sourceSha:manifest.sourceSha,manifestSha256:hash,alreadyApplied:applied,draftIds:draft.changes,publishedIds:published.changes};
if((flags.includes('--apply')||flags.includes('--verify-rollback'))&&!applied&&(draft.changes.length||published.changes.length)){
 const quote=s=>"'"+String(s).replaceAll("'","''")+"'",json=v=>quote(JSON.stringify(v))+'::jsonb';
 // Both historical saves commit atomically: normalized public data first, then the independently preserved draft.
 // No new record, media reference, title, publication status or pending draft is promoted by this repair.
 const sql=`do $repair$ declare c public.website_content_collections;v integer;begin
 select * into c from public.website_content_collections where id=${quote(c.id)}::uuid for update;
 if c.revision<>${c.revision} or c.draft is distinct from ${json(c.draft)} or c.published is distinct from ${json(c.published)} or c.config is distinct from ${json(c.config)} then raise exception 'Collection changed; dry-run again';end if;
 perform set_config('request.jwt.claim.role','service_role',true);perform set_config('request.jwt.claims','{"role":"service_role"}',true);v:=c.revision;
 ${published.changes.length&&c.published_revision!==null?`v:=public.save_website_content(c.id,v,${json(published.records)},'publish',${quote(staff.user_id)}::uuid);`:''}
 v:=public.save_website_content(c.id,v,${json(draft.records)},'draft',${quote(staff.user_id)}::uuid);
 update public.website_content_collections set config=config||jsonb_build_object('primaryCaptionsRecovered',${json({sourceSha:manifest.sourceSha,manifestSha256:hash})}) where id=c.id;
 perform public.log_audit_event(p_action=>'content.primary_captions_recovered',p_entity_type=>'website_content_collection',p_entity_id=>c.id,p_org=>c.organization_id,p_actor_user_id=>${quote(staff.user_id)}::uuid,p_before=>jsonb_build_object('revision',c.revision),p_after=>jsonb_build_object('revision',v,'draft_count',${draft.changes.length},'published_count',${published.changes.length}));
 end $repair$;`;
 let token=process.env.SUPABASE_ACCESS_TOKEN;if(!token)token=execFileSync('security',['find-generic-password','-s','Supabase CLI','-w'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
 const response=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query:flags.includes('--verify-rollback')?'begin;'+sql+'rollback;':sql})});
 if(!response.ok)throw Error(`Caption repair failed (${response.status}): ${await response.text()}`);
 const {data:after,error:ae}=await db.from('website_content_collections').select('revision,draft,published,config').eq('id',c.id).single();if(ae)throw ae;
 const expectedDraft=flags.includes('--verify-rollback')?c.draft:draft.records,expectedPublished=flags.includes('--verify-rollback')?c.published:published.records;
 if(JSON.stringify(after.draft)!==JSON.stringify(expectedDraft)||JSON.stringify(after.published)!==JSON.stringify(expectedPublished)){
  // PostgreSQL JSONB key order differs; compare structurally via canonical serialization below.
  const stable=v=>JSON.stringify(v,(_k,val)=>val&&typeof val==='object'&&!Array.isArray(val)?Object.fromEntries(Object.entries(val).sort(([a],[b])=>a.localeCompare(b))):val);
  if(stable(after.draft)!==stable(expectedDraft)||stable(after.published)!==stable(expectedPublished))throw Error('Caption repair readback mismatch');
 }
 proof.resultRevision=after.revision;proof.verified=true;proof.rolledBack=flags.includes('--verify-rollback');
}
if(flags.includes('--receipt')){const index=flags.indexOf('--receipt');await writeFile(flags[index+1],JSON.stringify(proof,null,2));}
console.log(JSON.stringify(proof,null,2));
