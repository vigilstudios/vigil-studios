import {z} from 'zod';
export const collectionModules={members:'team',projects:'portfolio',chapters:'portfolio',works:'portfolio',frames:'gallery',photos:'gallery',clips:'gallery',images:'gallery',scenes:'gallery',pieces:'gallery',records:'gallery',voices:'testimonials',testimony:'testimonials',voice:'testimonials',reviews:'testimonials',products:'products',product:'products',items:'products',relatedProducts:'products',entries:'services',services:'services',capabilities:'services',questions:'faq',faqs:'faq',spreads:'products',anchor:'products'} as const;
export type CollectionModule=(typeof collectionModules)[keyof typeof collectionModules];
export const featuredSectionSchema=z.object({mode:z.enum(['all','featured','selected']),capacity:z.number().int().min(1).max(500),label:z.string().trim().min(1).max(160),mediaType:z.enum(['image','video']).optional(),catalogue:z.string().min(1).max(180).optional(),productIds:z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)).max(500).refine(ids=>new Set(ids).size===ids.length,'Choose each product once.').optional()}).strict();
export const contentHubSettingsSchema=z.record(z.string().max(100),featuredSectionSchema);
export type ContentHubSettings=z.infer<typeof contentHubSettingsSchema>;
export type ContentHubDisplay=ContentHubSettings[string];
export type CollectionCapability={field:string;module:CollectionModule;minimum:number;maximum:number;singleton:boolean;hasMedia:boolean;pricedProducts:boolean};
export function schemaBase(schema:z.core.$ZodType):z.core.$ZodType {for(let i=0;i<12;i++){if(schema instanceof z.ZodOptional||schema instanceof z.ZodNullable||schema instanceof z.ZodPrefault)schema=schema.unwrap();else if(schema instanceof z.ZodDefault)schema=schema.removeDefault();else return schema;}return schema;}
export function collectionCapabilities(component:string,schema:z.ZodTypeAny):CollectionCapability[]{
 const base=schemaBase(schema);if(!(base instanceof z.ZodObject))return [];
 const content=base.shape.content&&schemaBase(base.shape.content);if(!(content instanceof z.ZodObject))return [];
 return Object.entries(collectionModules).flatMap(([field,module])=>{
  const supported=module==='team'?component==='about.team':module==='portfolio'||module==='gallery'?component.startsWith('work.'):module==='testimonials'?component.startsWith('proof.'):module==='products'?component.startsWith('commerce.'):module==='services'?component.startsWith('services.'):['questions','faqs'].includes(field);
  if(!supported||!content.shape[field])return [];
  const value=schemaBase(content.shape[field]),singleton=!(value instanceof z.ZodArray);
  const element=schemaBase(value instanceof z.ZodArray?value.element:value),item=element instanceof z.ZodDiscriminatedUnion?schemaBase(element.options[0]):element;if(!(item instanceof z.ZodObject))return [];
  const nested=item.shape.product&&schemaBase(item.shape.product),shape=nested instanceof z.ZodObject?nested.shape:item.shape;
  if(module==='testimonials'?!shape.quote:module==='faq'?!shape.answer:!shape.title&&!shape.name&&!shape.question)return [];
  const limits=value instanceof z.ZodArray?z.toJSONSchema(value,{unrepresentable:"any"}):null;
  return [{field,module,singleton,minimum:limits?.minItems??(singleton?1:0),maximum:limits?.maxItems??(singleton?1:500),hasMedia:Boolean(shape.image||shape.scene||shape.video||shape.media||module==='testimonials'),pricedProducts:module==='products'&&Boolean(shape.price)}];
 });
}
export function validateContentHubSettings(component:string,schema:z.ZodTypeAny,settings:ContentHubSettings|undefined){
 for(const [field,setting] of Object.entries(settings??{})){const capability=collectionCapabilities(component,schema).find(c=>c.field===field);if(!capability)throw Error('This section does not support that editable collection.');if(capability.module!=='products'&&(setting.mode!=='featured'||setting.catalogue||setting.productIds))throw Error('Product selection is only supported by commerce collections.');if(setting.mode==='selected'&&!setting.productIds)throw Error('Choose specific products for this section.');if(setting.mode!=='selected'&&setting.productIds)throw Error('Specific product IDs require selected-product mode.');if(setting.capacity<Math.max(1,capability.minimum)||setting.capacity>capability.maximum)throw Error(`This section supports ${Math.max(1,capability.minimum)}–${capability.maximum} featured items.`);if(setting.mediaType&&!capability.hasMedia)throw Error('This collection does not support media filtering.');}
}
/** The authored document retains its content; initial previews use the configured display budget. */
export function featuredDisplaySection<T extends {content:unknown;contentHub?:ContentHubSettings}>(section:T):T {
 if(!section.contentHub)return section;
 const content={...section.content as Record<string,unknown>};for(const[field,setting]of Object.entries(section.contentHub)){if(Array.isArray(content[field])){const rows=content[field];content[field]=setting.mode==='selected'?setting.productIds!.flatMap(id=>rows.filter(row=>productSourceId(row)===id)):setting.mode==='featured'?rows.slice(0,setting.capacity):rows;}}
 return {...section,content};
}

/** Provider-neutral identity shared by Lab selections and Content Hub overlays. */
export function productSourceId(value:unknown):string{const row=value&&typeof value==='object'?value as Record<string,unknown>:{};const product=row.product&&typeof row.product==='object'?row.product as Record<string,unknown>:row;return typeof product.productId==='string'?product.productId:'';}
