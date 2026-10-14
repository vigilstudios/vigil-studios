import type {ContentRecord} from './contract';
function canonical(value:unknown):string {
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(value&&typeof value==='object')return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
 return JSON.stringify(value)??'null';
}
export const sameContent = (a:unknown,b:unknown) => canonical(a)===canonical(b);
/** Compare authoring snapshots, not revision numbers or rendered/signed URLs. */
export function draftRecordIds(records:ContentRecord[],published:ContentRecord[]):Set<string> {
 const previous=new Map(published.filter(r=>!r.deleted).map(r=>[r.id,r]));
 const current=new Map(records.map(r=>[r.id,r]));
 const common=records.filter(r=>!r.deleted&&previous.has(r.id)).map(r=>r.id);
 const previousOrder=published.filter(r=>!r.deleted&&current.has(r.id)&&!current.get(r.id)!.deleted).map(r=>r.id);
 const changed=new Set<string>();
 for(const row of records){
  const old=previous.get(row.id);
  if(row.deleted){if(old)changed.add(row.id);continue;}
  if(!old||!sameContent(row,old)||common.indexOf(row.id)!==previousOrder.indexOf(row.id))changed.add(row.id);
 }
 for(const row of previous.values())if(!current.has(row.id))changed.add(row.id);
 return changed;
}
export function savedDraftRecords(saved:ContentRecord[],published:ContentRecord[]):ContentRecord[]{
 const ids=draftRecordIds(saved,published);return saved.filter(r=>!r.deleted&&ids.has(r.id));
}
