import type {ContentRecord} from './contract';

type MediaSite = {status:string;live_url:string|null;preview_url:string|null};
/** Only presentation URLs are resolved. Authoring paths remain relative to their own website. */
export function standaloneMediaPreviews(records:ContentRecord[],site:MediaSite):Record<string,string> {
 const address=site.status==='live'?site.live_url:site.preview_url??site.live_url;
 if(!address)return {};
 let origin:URL;
 try { origin=new URL(address); } catch { return {}; }
 if(origin.protocol!=='https:'||origin.username||origin.password)return {};
 const previews:Record<string,string>={};
 const add=(path:string|undefined)=>{
  if(path?.startsWith('/')&&!path.startsWith('//')&&!/[\s\\]/.test(path))previews[path]=new URL(path,origin).href;
 };
 for(const record of records)if('media' in record.data)for(const media of record.data.media){if(!media.id)add(media.src);if(!media.posterId)add(media.poster);}
 return previews;
}
/** Upload IDs take precedence over static asset paths, including private video posters. */
export function contentPreviewUrl(previews:Record<string,string>,path:string|undefined,id?:string):string|undefined {
 return (id?previews[id]:path?previews[path]:undefined)??path;
}
