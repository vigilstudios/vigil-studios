import 'server-only';
import type {DbClient} from '@/lib/vigil/types';
import type {ContentRecord} from './contract';
export async function mediaPreviews(admin:DbClient,website:string,org:string,records:ContentRecord[]){
 const ids=[...new Set(records.flatMap(r=>'media' in r.data?r.data.media.flatMap(m=>[m.id,m.posterId].filter((s):s is string=>Boolean(s))):[]))];if(!ids.length)return {};
 const {data:media,error}=await admin.from('website_content_media').select('id').eq('website_id',website).eq('organization_id',org).eq('ready',true).in('id',ids);if(error)throw error;
 const {data:assets,error:assetError}=await admin.from('project_assets').select('id,object_path').eq('organization_id',org).eq('bucket_id','content-media').in('id',(media??[]).map(m=>m.id));if(assetError)throw assetError;
 const {data:signed,error:signError}=await admin.storage.from('content-media').createSignedUrls((assets??[]).map(a=>a.object_path),900);if(signError)throw signError;return Object.fromEntries((assets??[]).flatMap(a=>{const url=signed?.find(s=>s.path===a.object_path)?.signedUrl;return url?[[a.id,url]]:[];}));
}
export function publicRecords(records:ContentRecord[],website:string,collection:string,review:boolean){
 const mediaUrl=(id:string,record:string)=>`https://www.vigilstudios.co/api/content/${website}/media/${id}?collection=${collection}&record=${record}${review?'&review=published':''}`;
 return records.filter(r=>!r.deleted).map(r=>({...r,data:'media' in r.data?{...r.data,media:r.data.media.map(m=>({...m,src:m.id?mediaUrl(m.id,r.id):m.src,...(m.posterId?{poster:mediaUrl(m.posterId,r.id)}:{})}))}:r.data}));
}
