"use client";
import { createContext, useContext, useId, useState, type CSSProperties, type ReactNode } from "react";
import type { EndingForm } from "../composition/ending-schemas";
import { DesignButton } from "../primitives/DesignButton";
import { inquiryFormDefaults, type InquiryFormAppearance } from "./appearance";
import "./appearance.css";

export type FormSubmission = { integration: string; values: Record<string,string>; signal: AbortSignal };
export type FormAdapter = (input: FormSubmission) => Promise<{ ok: boolean; error?: string }>;
const FormContext = createContext<FormAdapter | undefined>(undefined);
/** Hosts supply an existing submission adapter. No endpoint/credentials enter serialized sites. */
export function FormSubmissionProvider({adapter,children}:{adapter:FormAdapter;children:ReactNode}) {
  return <FormContext.Provider value={adapter}>{children}</FormContext.Provider>;
}
export function InquiryForm({config,appearance}:{config:EndingForm;appearance?:InquiryFormAppearance}) {
  const uid = useId(), adapter = useContext(FormContext);
  const [state,setState] = useState<"idle"|"pending"|"success"|"draft"|"error">("idle");
  const [error,setError] = useState("");
  const unavailable = config.submission.mode === "unavailable" || config.submission.mode === "host" && !adapter;
  const design = { ...inquiryFormDefaults, ...appearance };
  const style = appearance ? {
    "--de-form-width": `${design.maxWidth}px`, "--de-form-padding": `${design.padding}px`, "--de-form-gap": `${design.gap}px`,
    "--de-form-field-height": `${design.fieldHeight}px`, "--de-form-title-size": `${design.titleSize}px`,
    "--de-form-label-size": `${design.labelSize}px`, "--de-form-text-size": `${design.textSize}px`,
    "--de-form-background": design.background, "--de-form-field-background": design.fieldBackground,
    "--de-form-text": design.textColor, "--de-form-border": design.borderColor, "--de-form-focus": design.focusColor,
  } as CSSProperties : undefined;
  return <form className="de-ending-form" style={style} data-form-custom={appearance ? true : undefined}
    data-form-treatment={appearance && design.treatment} data-form-shape={appearance && design.shape}
    data-field-style={appearance && design.fieldStyle} data-field-shape={appearance && design.fieldShape}
    data-form-columns={appearance && design.columns} data-form-align={appearance && design.alignment}
    data-form-heading-align={appearance && design.headingAlignment} data-label-case={appearance && design.labelCase}
    aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-description`} onSubmit={async event=>{
    event.preventDefault();
    if(unavailable || state === "pending") return;
    const form=event.currentTarget;
    if(!form.reportValidity()) return;
    const data=new FormData(form),values=Object.fromEntries(config.fields.map(field=>[field.id,String(data.get(field.id)??"")]));
    if(config.submission.mode === "email-draft") {
      const body=config.fields.map(field=>`${field.label}: ${values[field.id]}`).join("\n\n");
      window.location.href=`mailto:${config.submission.destination.email}?subject=${encodeURIComponent(config.title)}&body=${encodeURIComponent(body)}`;
      setState("draft"); return;
    }
    if(config.submission.mode !== "host" || !adapter) return;
    setState("pending");setError("");
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      const result=await Promise.race([adapter({integration:config.submission.integration,values,signal:controller.signal}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("The request timed out. Please try again or use the contact options."));},15000);})]);
      if(!result.ok) throw new Error(result.error??"Your inquiry could not be sent. Please try again.");
      setState("success");form.reset();
    } catch(failure) {setError(failure instanceof Error?failure.message:"Your inquiry could not be sent.");setState("error");}
    finally {clearTimeout(timer);}
  }}>
    <div className="de-ending-form-heading"><h3 id={`${uid}-title`} className="de-heading">{config.title}</h3>
    <p id={`${uid}-description`} className="de-text">{unavailable?config.unavailableMessage:config.description??(config.submission.mode==="email-draft"?"Opens a draft in your email app. Review and send it there.":"Complete the fields below.")}</p></div>
    <div className="de-ending-fields">
      {config.fields.map(field=><div className="de-ending-field" key={field.id} data-type={field.type}>
        <label htmlFor={`${uid}-${field.id}`}>{field.label}{field.required?<span aria-hidden="true"> *</span>:null}</label>
        {field.type === "textarea" ? <textarea id={`${uid}-${field.id}`} name={field.id} required={field.required} rows={appearance ? design.textareaRows : 5} maxLength={4000} aria-describedby={field.description?`${uid}-${field.id}-hint`:undefined}/>
        :field.type === "select" ? <select id={`${uid}-${field.id}`} name={field.id} required={field.required} defaultValue="" aria-describedby={field.description?`${uid}-${field.id}-hint`:undefined}><option value="">Choose an option</option>{field.options?.map(option=><option key={option}>{option}</option>)}</select>
        :<input id={`${uid}-${field.id}`} name={field.id} type={field.type} required={field.required} autoComplete={field.autocomplete} maxLength={field.type==="checkbox"?undefined:500} aria-describedby={field.description?`${uid}-${field.id}-hint`:undefined}/>}
        {field.description&&<p id={`${uid}-${field.id}-hint`} className="de-text de-text--small">{field.description}</p>}
      </div>)}
    </div>
    <div className="de-ending-form-submit" data-align={appearance?.submit?.alignment ?? "left"}><DesignButton type="submit" disabled={unavailable||state==="pending"} presentation={appearance ? appearance.submit ?? {} : {variant:"primary",size:"medium"}}>{state==="pending"?"Sending…":config.submitLabel}</DesignButton></div>
    <p role={state==="error"?"alert":"status"} aria-live="polite">{state==="success"?config.successMessage:state==="draft"?"Your email draft was requested. Send it in your email app; nothing has been submitted here.":error}</p>
  </form>;
}
