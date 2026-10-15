import { createHash } from 'node:crypto';
import { parseSiteDefinition } from '@/design-engine/site/persistence';
import type { SiteDefinition } from '@/design-engine/site/model';
import type { ContentBinding, ContentModule, ContentRecord, ContentMedia } from './contract';
import { payloadSchemas } from './contract';

type ObjectValue = Record<string,unknown>;
export type AdapterConfig={templates:Record<string,ObjectValue>;singleton?:boolean;sourceIds:Record<string,string>;editableFields?:string[];featuredSlotBudget?:number;featuredLabel?:string;featuredMediaType?:'image'|'video';featuredRequireFull?:boolean;autoDiscovered?:boolean;maxMedia?:number;hasDetailLinks?:boolean};
export type BoundCollection={id:string;binding:ContentBinding;config:AdapterConfig;records:ContentRecord[];publishedRecords?:ContentRecord[];revision:number;publishedRevision:number|null};
const object=(v:unknown):ObjectValue=>v&&typeof v==='object'&&!Array.isArray(v)?v as ObjectValue:{};
const str=(v:unknown)=>typeof v==='string'?v:'';
const slug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110)||'entry';
function stableId(key:string){const hex=createHash('sha256').update(key).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;}
const collectionFields:Record<string,Exclude<ContentModule,'blog'>>={projects:'portfolio',chapters:'portfolio',works:'portfolio',frames:'gallery',photos:'gallery',clips:'gallery',voices:'testimonials',testimony:'testimonials',voice:'testimonials',reviews:'testimonials',products:'products',items:'products',entries:'services',services:'services',capabilities:'services',questions:'faq',faqs:'faq'};
function supported(component:string,field:string,contentModule:ContentModule){return contentModule==='portfolio'||contentModule==='gallery'?component.startsWith('work.'):contentModule==='testimonials'?component.startsWith('proof.'):contentModule==='products'?component.startsWith('commerce.'):contentModule==='services'?component.startsWith('services.'):contentModule==='faq'&&['questions','faqs'].includes(field);}
function mediaFrom(value:unknown):ContentMedia[]{
 const row=object(value),m=object(row.image??row.scene??row.video??row.media),video=Boolean(row.video)||m.mediaType==='video';
 if(Array.isArray(row.media))return row.media.flatMap(mediaFrom);
 const image=object(m.image??m.video??m),poster=object(image.poster),playback=object(image.playback);
 if(!str(image.src))return [];
 return [{type:video||m.kind==='video'?'video':'image',src:str(image.src),alt:str(image.alt??image.label??row.title)||'Content image',caption:str(image.caption),...(str(poster.src??playback.poster)?{poster:str(poster.src??playback.poster)}:{}),width:Number(image.width)||1200,height:Number(image.height)||900}];
}
export function recordFromRaw(contentModule:Exclude<ContentModule,'blog'>,raw:ObjectValue,id:string,address:string):ContentRecord{
 const row=object(raw.product??raw),author=object(row.author);
 const base={title:str(row.title??row.name??row.question??author.name).slice(0,160),description:str(row.description??row.note??row.summary??row.narrative??row.body),category:str(row.category),media:mediaFrom(row)};
 const data=contentModule==='testimonials'?{title:str(author.name??row.title??row.name),quote:str(row.quote),attribution:str(author.name??row.name),company:str(author.organization??row.company),role:str(author.role),placeholder:object(row.provenance).status==='demo',media:mediaFrom({image:author.avatar})}:
 contentModule==='faq'?{title:str(row.question??row.title),answer:str(row.answer??row.body)}:
 contentModule==='portfolio'?{...base,context:str(row.context),brand:str(row.brand),tags:Array.isArray(row.tags)?row.tags.map(str):[],link:''}:
 contentModule==='gallery'?{...base,collection:str(row.collection)}:
 contentModule==='products'?{...base,priceLabel:str(object(row.price).label),providerRef:str(row.productId),link:str(object(row.destination).href)}:{...base,link:str(object(row.detail).href)};
 return {id,slug:address,data:payloadSchemas[contentModule].parse(data),deleted:false,featured:false};
}
export function discoverBindings(site:SiteDefinition,websiteId:string):BoundCollection[]{
 const collections:BoundCollection[]=[];
 for(const page of site.pages)for(const section of page.sections){
  const content=object(section.content);
  for(const [field,value] of Object.entries(content)){
   const contentModule=collectionFields[field];if(!contentModule||!supported(section.component,field,contentModule))continue;
   const singleton=['testimony','voice'].includes(field),raws=Array.isArray(value)?value:singleton?[value]:[];
   // Only semantic collections actually implemented by the section. No generic CMS inference.
   if(raws.length&&!raws.every(raw=>{const v=object(object(raw).product??raw);return contentModule==='testimonials'?typeof v.quote==='string':contentModule==='faq'?typeof v.answer==='string':typeof v.title==='string'||typeof v.name==='string';}))continue;
   const key=`${page.id}-${section.id}-${field}`.slice(0,180),templates:AdapterConfig['templates']={},sourceIds:Record<string,string>={};
   const records=raws.map((raw,i)=>{const row=object(raw),source=str(row.id??row.productId??object(row.product).productId)||String(i),id=stableId(`${websiteId}:${key}:${source}`),address=slug(str(row.slug??object(row.product).slug)||str(row.title??object(row.product).title)||`${field}-${i+1}`);templates[id]=row;sourceIds[id]=source;return recordFromRaw(contentModule,row,id,str(row.slug??object(row.product).slug)?address:`${address}-${i+1}`);});
   collections.push({id:'',binding:{version:1,key,module:contentModule,label:contentModule==='portfolio'?'Portfolio':contentModule==='faq'?'FAQ':contentModule[0].toUpperCase()+contentModule.slice(1),pageId:page.id,sectionId:section.id,field,adapter:'professional'},config:{templates,sourceIds,singleton,autoDiscovered:true,maxMedia:raws.some(r=>Array.isArray(object(object(r).product??r).media))?10:1,hasDetailLinks:raws.some(r=>Boolean(object(object(r).product??r).slug)),editableFields:editableFields(contentModule,raws.map(object))},records,revision:1,publishedRevision:null});
  }
 }
 return collections;
}
function imageValue(media:ContentMedia){return {src:media.src,alt:media.alt,width:media.width??1200,height:media.height??900,...(media.caption?{caption:media.caption}:{}),...(media.type==='video'?{mediaType:'video',playback:{autoplay:false,controls:true,muted:true,...(media.poster?{poster:media.poster}:{})}}:{})};}
function overlayRaw(contentModule:ContentModule,record:ContentRecord,config:AdapterConfig):ObjectValue{
 const original=config.templates[record.id]??Object.values(config.templates)[0]??{},outer=structuredClone(original),nested=Boolean(outer.product),row=nested?object(outer.product):outer,d=object(record.data);
 if('id' in row)row.id=config.sourceIds[record.id]??`item-${record.id}`;
 if('productId' in row)row.productId=str(d.providerRef)||config.sourceIds[record.id]||`item-${record.id}`;
 if('slug' in row)row.slug=record.slug;
 for(const key of ['title','name','question'])if(key in row)row[key]=d.title;
 for(const key of ['description','note','summary','narrative','body'])if(key in row)row[key]=d.description;
 if('category' in row)row.category=d.category;
 if('brand' in row)row.brand=d.brand;if('context' in row)row.context=d.context;if(Array.isArray(row.tags))row.tags=d.tags;
 if(contentModule==='products'&&str(d.link)&&'destination' in row)row.destination={...object(row.destination),href:d.link};
 if(contentModule==='services'&&str(d.link)&&'detail' in row)row.detail={...object(row.detail),href:d.link};
 if(contentModule==='faq')row.answer=d.answer;
 if(contentModule==='testimonials'){
  row.quote=d.quote;const author=object(row.author);row.author={...author,name:d.attribution,...(d.role?{role:d.role}:{}),...(d.company?{organization:d.company}:{})};if(Array.isArray(d.media)&&d.media[0])row.author={...object(row.author),avatar:imageValue(d.media[0] as ContentMedia)};
  // Provenance remains staff controlled. Customers cannot turn illustrative proof into verified proof.
 }
 const media=Array.isArray(d.media)?d.media as ContentMedia[]:[],first=media[0];
 if(first){for(const field of ['image','scene'])if(field in row){const previous=object(row[field]),image:ObjectValue={...previous,...imageValue(first)};if(first.type==='image'&&previous.mediaType==='video'){delete image.mediaType;delete image.playback;}if(previous.src!==first.src){for(const key of ['mobileSrc','srcSet','sizes','mobileFocal'])delete image[key];}row[field]=image;};
  if('video' in row)row.video={...object(row.video),src:first.src,width:first.width??1200,height:first.height??900,label:first.alt,poster:{src:first.poster??first.src,alt:first.alt,width:first.width??1200,height:first.height??900},playback:{...object(object(row.video).playback),autoplay:false}};
  if(Array.isArray(row.media)){const originalMedia=row.media;row.media=media.map((m,i)=>{const base=object(originalMedia[i]);return m.type==='video'?{...base,kind:'video',id:str(base.id)||`media-${i}`,label:str(base.label)||m.alt.slice(0,80),video:{...object(base.video),src:m.src,width:m.width??1200,height:m.height??900,label:str(object(base.video).label)||m.alt.slice(0,160),poster:{...object(object(base.video).poster),src:m.poster,alt:m.alt,width:m.width??1200,height:m.height??900}}}:{...base,kind:base.kind==='interactive-placeholder'?'interactive-placeholder':'image',id:str(base.id)||`media-${i}`,label:str(base.label)||m.alt.slice(0,80),image:{...object(base.image),...imageValue(m)}};});}
 }
 if(nested)outer.product=row;return outer;
}
export function applyBindings(site:SiteDefinition,collections:BoundCollection[],hideEmpty=false):SiteDefinition{
 const next=structuredClone(site);
 for(const c of collections){const page=next.pages.find(p=>p.id===c.binding.pageId),section=page?.sections.find(s=>s.id===c.binding.sectionId);if(!section)continue;
  if(hideEmpty&&!c.records.some(r=>!r.deleted)){page!.sections=page!.sections.filter(s=>s.id!==c.binding.sectionId);continue;}
  const fieldValue=(section.content as ObjectValue)[c.binding.field],scaffolds=Array.isArray(fieldValue)?fieldValue:[fieldValue];
  const config={...c.config,templates:{...c.config.templates}};
  for(const record of c.records){const sourceId=c.config.sourceIds?.[record.id]??`item-${record.id}`,scaffold=scaffolds.map(object).find(raw=>str(raw.id??raw.productId??object(raw.product).productId)===sourceId||str(raw.slug??object(raw.product).slug)===record.slug);if(scaffold)config.templates[record.id]=scaffold;else if(!config.templates[record.id]&&scaffolds[0])config.templates[record.id]=object(scaffolds[0]);}
  const rows=c.records.filter(r=>!r.deleted).map(r=>overlayRaw(c.binding.module,r,config));
  (section.content as ObjectValue)[c.binding.field]=c.config.singleton?rows[0]:rows;
 }
 return parseSiteDefinition(next);
}

/** Convert Lab's supported field edits back to the existing stable records. Other section props stay in the site document. */
export function recordsFromLab(site:SiteDefinition,collection:BoundCollection):ContentRecord[]{
 const section=site.pages.find(p=>p.id===collection.binding.pageId)?.sections.find(s=>s.id===collection.binding.sectionId);
 if(!section)return collection.records;
 const value=(section.content as ObjectValue)[collection.binding.field],raws=Array.isArray(value)?value:[value];
 const editedRecords=raws.filter(Boolean).map((raw,i)=>{const objectRaw=object(raw),source=str(objectRaw.id??objectRaw.productId??object(objectRaw.product).productId),existing=collection.records.find(r=>collection.config.sourceIds[r.id]===source)||collection.records.filter(r=>!r.deleted)[i],id=existing?.id??stableId(`${collection.binding.key}:${source||i}`);
  const ownedMedia=existing&&'media' in existing.data?existing.data.media.flatMap(m=>[m.id,m.posterId].filter(Boolean)):[];
  const portableRaw=JSON.parse(JSON.stringify(objectRaw,(_key,value)=>typeof value==='string'&&ownedMedia.some(mediaId=>value.includes(`/media/${mediaId}?`))?value.replace(/&draft=1(?=&|$)/g,''):value));
  const record=recordFromRaw(collection.binding.module as Exclude<ContentModule,'blog'>,portableRaw,id,existing?.slug??slug(str(objectRaw.title)||`${collection.binding.field}-${i}`));
  if(existing&&'media' in record.data&&'media' in existing.data){const oldMedia=existing.data.media;record.data.media=record.data.media.map((m,j)=>{const old=oldMedia[j];if(!old?.id||!m.src.includes(`/media/${old.id}?`))return m;const next={...old,alt:m.alt,caption:m.caption};if(old.posterId&&!m.poster?.includes(`/media/${old.posterId}?`)){delete next.posterId;next.poster=m.poster;}return next;});}
  return {...record,featured:existing?.featured??false,...(existing?.featuredOrder?{featuredOrder:existing.featuredOrder}:{}),...(existing&&'placeholder' in existing.data&&'placeholder' in record.data?{data:{...record.data,placeholder:existing.data.placeholder}}:{})};
 });
 const retained=collection.records.filter(old=>!editedRecords.some(r=>r.id===old.id)).map(old=>({...old,deleted:true}));
 return [...editedRecords,...retained];
}

function editableFields(kind:ContentModule,rows:ObjectValue[]):string[]{
 const fields=new Set(['title']);for(const original of rows){const row=object(original.product??original);if(['description','note','summary','narrative','body'].some(k=>k in row))fields.add('description');for(const name of ['category','brand','context','tags'])if(name in row)fields.add(name);if(['image','scene','video','media'].some(k=>k in row))fields.add('media');if('detail' in row||'destination' in row)fields.add('link');}
 if(kind==='testimonials')return ['title','quote','attribution','role','company','media'];if(kind==='faq')return ['title','answer'];if(kind==='products'){fields.add('priceLabel');fields.add('providerRef');}return [...fields];
}
