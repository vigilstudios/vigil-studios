"use client";
import { useState } from "react";
import { parseSection, type SectionInstance } from "../../composition/schemas";
import { endingSectionIds, type EndingSectionId } from "../../composition/ending-schemas";
import { inquiryPreset } from "../ending-fixtures";
import { makeEndingSection } from "../ending-fixtures";
import { exampleLogo } from "../client-adaptations";
import type { SiteDefinition } from "../../site/model";
import { materializeFooter, footerNavigationIssues } from "../../site/footer";
import { ActionForm } from "./ActionEditor";
import { actionSchema, type Action } from "../../site/action-schema";
type Path=(string|number)[];
function at(value:unknown,path:Path):unknown {
  return path.reduce<unknown>((record,key)=>record&&typeof record==="object"?(record as Record<string|number,unknown>)[key]:undefined,value);
}
function set(value:unknown,path:Path,patch:unknown) {
  let target=value as Record<string|number,unknown>;
  for(const key of path.slice(0,-1))target=target[key] as Record<string|number,unknown>;
  if(patch===undefined)delete target[path.at(-1)!];else target[path.at(-1)!]=patch;
}
function primitiveFields(value:unknown,path:Path=[]):{path:Path;value:string|number|boolean}[] {
  if(Array.isArray(value))return value.flatMap((item,index)=>primitiveFields(item,[...path,index]));
  if(!value||typeof value!=="object")return [];
  return Object.entries(value).flatMap(([key,item])=>{
    if(["destination","submission","id","kind","type","autocomplete"].includes(key))return [];
    return ["string","number","boolean"].includes(typeof item)?[{path:[...path,key],value:item as string|number|boolean}]:primitiveFields(item,[...path,key]);
  });
}
function actionFields(value:unknown,path:Path=[]):{path:Path;action:Action}[] {
  if(!value||typeof value!=="object")return [];
  return Object.entries(value).flatMap(([key,item])=>key==="destination"?actionSchema.safeParse(item).success?[{path:[...path,key],action:item as Action}]:[]:actionFields(item,[...path,Array.isArray(value)?Number(key):key]));
}
/** Finite form presets and ordinary content fields: no arbitrary CSS or code required. */
export function EndingContentEditor({site,section:input,onChange}:{site:SiteDefinition;section:SectionInstance;onChange:(section:SectionInstance)=>void}) {
  const [error,setError]=useState("");
  if(!endingSectionIds.includes(input.component as EndingSectionId))return null;
  const section=input as SectionInstance<EndingSectionId>;
  const groups="groups" in section.content?section.content.groups:[];
  const isFooter=section.component.startsWith("footer.");
  function patch(path:Path,value:unknown) {
    try {const next=structuredClone(section);set(next,path,value);onChange(parseSection(next));setError("");}catch(failure){setError(failure instanceof Error?failure.message:"Invalid content.");}
  }
  const fields=primitiveFields(section.content).filter(field=>!isFooter||!section.navigationSource||field.path[0]!=="groups");
  const forms=["form","newsletter"].filter(key=>key in section.content||key==="form"&&section.component==="contact.inquiry"||key==="newsletter"&&["footer.split","footer.banner"].includes(section.component));
  function append(key:"details"|"socials"|"legal") {
    const current=at(section.content,[key]);if(!Array.isArray(current))return;
    patch(["content",key],[...current,{id:`link-${crypto.randomUUID()}`,title:"New destination",destination:{type:"email",email:"hello@example.com"}}]);
  }
  return <details className="composition-action-editor" open><summary>Content, contact and forms</summary><p>Content changes apply when you leave a field. Actions use the current Site Definition.</p>
    {section.component==="cta.signal"&&<label><input type="checkbox" checked={!!section.content.image} onChange={event=>patch(["content","image"],event.target.checked?makeEndingSection("cta.signal",section.id).content.image:undefined)}/>Include conversion image</label>}
    {isFooter&&"brand" in section.content&&<label>Brand mark<select aria-label="Footer brand mark" value={section.content.logo?.kind??"wordmark"} onChange={event=>patch(["content","logo"],exampleLogo(String(at(section.content,["brand"])),event.target.value as "wordmark"|"text"|"image"|"combined"|"symbol"))}>{["wordmark","text","image","combined","symbol"].map(kind=><option key={kind}>{kind}</option>)}</select></label>}
    {isFooter&&<details open><summary>Footer sitemap source</summary><label>Navigation source<select aria-label="Footer navigation source" value={section.navigationSource?"site":"authored"} onChange={event=>{
      try {
        const next=event.target.value==="site"?parseSection({...section,navigationSource:{mode:"site",depth:"all"}}):parseSection({...materializeFooter(site,section),navigationSource:undefined});
        const issues=next.navigationSource?footerNavigationIssues(site,next):[];if(issues.length)throw new Error(issues.join(" "));onChange(next);setError("");
      }catch(failure){setError(String(failure));}
    }}><option value="authored">Authored groups and typed destinations</option><option value="site">Derive from Site Tree</option></select></label>{section.navigationSource&&<><p>Uses page navigation labels, visibility, ordering and stable IDs. Sitemap depth is controlled by this Footer’s capability.</p><fieldset><legend>Selected root pages (none selects all visible roots)</legend>{site.pages.map(page=><label key={page.id}><input type="checkbox" checked={section.navigationSource?.pageIds?.includes(page.id)??false} onChange={event=>{
      const ids=new Set(section.navigationSource?.pageIds??[]);if(event.target.checked)ids.add(page.id);else ids.delete(page.id);
      try {const next=parseSection({...section,navigationSource:{...section.navigationSource,pageIds:ids.size?[...ids]:undefined}});const issues=footerNavigationIssues(site,next);if(issues.length)throw new Error(issues.join(" "));onChange(next);setError("");}catch(failure){setError(String(failure));}
    }}/>{page.navLabel??page.title}</label>)}</fieldset></>}</details>}
    {forms.map(key=>{
      const form=at(section.content,[key]);
      return <details key={key} open><summary>{key==="newsletter"?"Newsletter":"Inquiry form"}</summary><label><input type="checkbox" checked={!!form} onChange={event=>patch(["content",key],event.target.checked?inquiryPreset(key==="newsletter"?"newsletter":"general"):undefined)}/>Include {key}</label>{!!form&&typeof form==="object"&&"submission" in form&&<>
        <label>Field set<select aria-label={`${key} field set`} defaultValue="" onChange={event=>{const preset=inquiryPreset(event.target.value as "general"|"collaboration"|"booking"|"newsletter");patch(["content",key,"fields"],preset.fields);}}><option value="" disabled>Choose a field set</option>{(key==="newsletter"?["newsletter"]:["general","collaboration","booking"]).map(preset=><option key={preset}>{preset}</option>)}</select></label>
        <label>Submission behavior<select aria-label={`${key} submission behavior`} value={String((form.submission as {mode:string}).mode)} onChange={event=>patch(["content",key,"submission"],event.target.value==="email-draft"?{mode:"email-draft",destination:{type:"email",email:"hello@example.com"}}:event.target.value==="host"?{mode:"host",integration:"inquiries"}:{mode:"unavailable"})}><option value="unavailable">Unconnected (no submission)</option><option value="email-draft">Open an email draft</option><option value="host">Use a host integration</option></select></label>
        {(form.submission as {mode:string}).mode==="host"&&<label>Host integration key<input aria-label={`${key} integration key`} defaultValue={String(at(form,["submission","integration"]))} onBlur={event=>patch(["content",key,"submission","integration"],event.target.value)}/></label>}
        <p>Host submissions require a FormSubmissionProvider adapter. Email drafts must be sent in the visitor’s email app.</p>
      </>}</details>;
    })}
    <details open><summary>Copy and media</summary>{fields.map(field=>{
      const label=field.path.join(" · ");
      return <label key={label}>{label}{typeof field.value==="boolean"?<input aria-label={label} type="checkbox" checked={field.value} onChange={event=>patch(["content",...field.path],event.target.checked)}/>:typeof field.value==="number"?<input aria-label={label} type="number" defaultValue={field.value} onBlur={event=>patch(["content",...field.path],Number(event.target.value))}/>:<textarea aria-label={label} rows={field.value.length>160?3:1} defaultValue={field.value} onBlur={event=>{if(event.target.value!==field.value)patch(["content",...field.path],event.target.value);}}/>}</label>;
    })}</details>
    <details><summary>Contact, social and legal destinations</summary>{actionFields(section.content).filter(field=>!section.navigationSource||field.path[0]!=="groups").map(field=><details key={field.path.join(".")}><summary>{String(at(section.content,[...field.path.slice(0,-1),"title"])??field.path.join(" · "))}</summary><ActionForm key={JSON.stringify(field.action)} site={site} initial={field.action} onApply={action=>patch(["content",...field.path],action)}/></details>)}</details>
    {isFooter&&!section.navigationSource&&"groups" in section.content&&<details><summary>Sitemap groups and links</summary><button type="button" onClick={()=>patch(["content","groups"],[...groups,{id:`group-${crypto.randomUUID()}`,title:"New group",links:[]}])}>Add sitemap group</button>{groups.map((group,index)=><div key={group.id}><p>{group.title}</p><button type="button" onClick={()=>patch(["content","groups",index,"links"],[...group.links,{id:`link-${crypto.randomUUID()}`,title:"New page",destination:{type:"page",pageId:site.navigation.homePageId}}])}>Add link to {group.title}</button><button type="button" onClick={()=>patch(["content","groups"],groups.filter((_,i)=>i!==index))}>Remove group {group.title}</button>{group.links.map((link,linkIndex)=><button type="button" key={link.id} onClick={()=>patch(["content","groups",index,"links"],group.links.filter((_,i)=>i!==linkIndex))}>Remove link {link.title}</button>)}</div>)}</details>}
    {"works" in section.content&&<details><summary>Gallery records</summary><button type="button" onClick={()=>{if("works" in section.content)patch(["content","works"],[...section.content.works,{...section.content.works.at(-1),id:`work-${crypto.randomUUID()}`,title:"New work"}]);}}>Add image record</button>{section.content.works.map((record,index)=><button type="button" key={record.id} onClick={()=>{if("works" in section.content)patch(["content","works"],section.content.works.filter((_,i)=>i!==index));}}>Remove record: {record.title}</button>)}</details>}
    <div className="de-gallery-controls">{(["details","socials","legal"] as const).filter(key=>key in section.content).map(key=><button type="button" key={key} onClick={()=>append(key)}>Add {key} destination</button>)}</div>
    {(["details","socials","legal"] as const).map(key=>{const items=at(section.content,[key]);return Array.isArray(items)&&items.map((item,index)=><button type="button" key={`${key}-${item.id}`} onClick={()=>patch(["content",key],items.filter((_,i)=>i!==index))}>Remove {key}: {item.title}</button>);})}
    <p role="alert">{error}</p>
  </details>;
}
