export const CONTENT_LIBRARY_TYPES = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-m4v'] as const;
export type LibraryAsset = {id:string;name:string;type:'image'|'video';size:number;url:string;caption:string};
export function libraryMediaType(type:string):'image'|'video'|null {
 return (CONTENT_LIBRARY_TYPES as readonly string[]).includes(type)?type.startsWith('video/')?'video':'image':null;
}
