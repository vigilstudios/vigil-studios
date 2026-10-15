import type {ContentModule,ContentRecord} from './contract';
export type FeaturedPolicy={capacity:number;label:string;mediaType?:'image'|'video';requireFull:boolean};
type FeaturedConfig={featuredSlotBudget?:number;featuredLabel?:string;featuredMediaType?:'image'|'video';featuredRequireFull?:boolean};
/** Only configured delivered sections expose featured slots. Legacy standalone Portfolio slots are videos. */
export function featuredPolicy(config:FeaturedConfig,module:ContentModule,adapter:string):FeaturedPolicy|null {
 const capacity=config.featuredSlotBudget;
 if(!Number.isInteger(capacity)||!capacity||capacity<1||capacity>500)return null;
 const legacyVideo=adapter==='standalone'&&module==='portfolio';
 return {capacity,label:config.featuredLabel||(legacyVideo?'Homepage videos':'Featured posts'),mediaType:config.featuredMediaType??(legacyVideo?'video':undefined),requireFull:config.featuredRequireFull??legacyVideo};
}
export function canFeatureRecord(row:ContentRecord,policy:FeaturedPolicy){return !row.deleted&&(!policy.mediaType||'media' in row.data&&row.data.media.some(m=>m.type===policy.mediaType));}
/** Explicit positions take precedence; old checkbox selections keep their existing relative order. */
export function featuredSlots(records:ContentRecord[],policy:FeaturedPolicy):(ContentRecord|undefined)[]{
 const slots:Array<ContentRecord|undefined>=Array.from({length:policy.capacity});
 const selected=records.filter(r=>!r.deleted&&r.featured);
 for(const row of selected)if(row.featuredOrder&&row.featuredOrder<=policy.capacity&&!slots[row.featuredOrder-1])slots[row.featuredOrder-1]=row;
 for(const row of selected.filter(r=>!r.featuredOrder)){const i=slots.findIndex(r=>!r);if(i>=0)slots[i]=row;}
 return slots;
}
/** Replacing a filled slot is explicit; selecting another featured post swaps their positions. */
export function assignFeaturedSlot(records:ContentRecord[],policy:FeaturedPolicy,position:number,id:string|null):ContentRecord[]{
 if(!Number.isInteger(position)||position<1||position>policy.capacity)throw Error('Choose an available featured position.');
 const selected=id?records.find(r=>r.id===id):undefined;
 if(id&&(!selected||!canFeatureRecord(selected,policy)))throw Error(`Choose ${policy.mediaType==='video'?'a post with a video':'an eligible post'} for this position.`);
 const slots=featuredSlots(records,policy).map(r=>r?.id),index=position-1,previous=slots[index],from=id?slots.indexOf(id):-1;
 if(from===index||!id&&!previous)return records;
 if(from>=0)slots[from]=previous;
 slots[index]=id??undefined;
 return records.map(row=>{if(row.deleted)return row;const rank=slots.indexOf(row.id)+1;if(rank)return {...row,featured:true,featuredOrder:rank};if(!row.featured&&row.featuredOrder===undefined)return row;const next={...row,featured:false};delete next.featuredOrder;return next;});
}
export function featuredIssues(records:ContentRecord[],policy:FeaturedPolicy|null,publish=false):string[]{
 const selected=records.filter(r=>!r.deleted&&r.featured);
 if(!policy)return records.some(r=>r.featuredOrder!==undefined)?['Featured positions are not configured for this section.']:[];
 if(selected.length>policy.capacity)return [`This section fits ${policy.capacity} featured posts. Replace a selection instead of adding another.`];
 if(selected.some(r=>!canFeatureRecord(r,policy)))return [`Featured positions require ${policy.mediaType==='video'?'a video':'an image'} on each selected post.`];
 const ranks=selected.flatMap(r=>r.featuredOrder===undefined?[]:[r.featuredOrder]);
 if(ranks.some(n=>!Number.isInteger(n)||n<1||n>policy.capacity)||new Set(ranks).size!==ranks.length||records.some(r=>!r.deleted&&!r.featured&&r.featuredOrder!==undefined))return ['Choose a different post for each featured position.'];
 if(publish&&policy.requireFull&&selected.length!==policy.capacity)return [`Fill all ${policy.capacity} featured positions before publishing. You can save an incomplete selection as a draft.`];
 return [];
}
