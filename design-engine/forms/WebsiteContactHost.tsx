"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FormSubmissionProvider, type FormAdapter } from "./InquiryForm";
import { getContactConfig, loadTurnstile, submitWebsiteInquiry, type ContactConfig } from "@/lib/vigil/contact/browser";
export function TurnstileVerification({siteKey,onToken}:{siteKey:string;onToken:(token:string)=>void}){
 const root=useRef<HTMLDivElement>(null);
 const callback=useRef(onToken);useEffect(()=>{callback.current=onToken;},[onToken]);
 const [error,setError]=useState('');
 useEffect(()=>{
  let canceled=false,id:string|undefined;
  loadTurnstile().then(api=>{if(canceled||!root.current)return;id=api.render(root.current,{sitekey:siteKey,action:'contact',theme:'auto',callback:(token:string)=>callback.current(token),
    'expired-callback':()=>callback.current(''),'error-callback':()=>{callback.current('');setError('Verification failed. Please reload or use email.');},'timeout-callback':()=>callback.current('')});
  }).catch(()=>{if(!canceled)setError('Verification could not load. Please use email.');});
  return()=>{canceled=true;if(id)window.turnstile?.remove(id);callback.current('');};
 },[siteKey]);
 return <div><div ref={root}/>{error&&<p role="alert">{error}</p>}<p className="de-text de-text--small">Spam protection by Cloudflare. Your inquiry is saved in the client’s Vigil Lead Hub.</p></div>;
}
/** Lab/template preview uses simulation; published hosts must explicitly bind a registered website. */
export function WebsiteContactHost({endpoint,preview=false,children}:{endpoint?:string;preview?:boolean;children:ReactNode}){
 const [config,setConfig]=useState<ContactConfig|null>(null),[error,setError]=useState('');
 const pendingKeys=useRef(new Map<string,{fingerprint:string;id:string}>());
 useEffect(()=>{
  if(preview||!endpoint)return;const controller=new AbortController();
  getContactConfig(endpoint,controller.signal).then(setConfig).catch(failure=>{if(!controller.signal.aborted)setError(failure instanceof Error?failure.message:'Contact unavailable.');});
  return()=>controller.abort();
 },[endpoint,preview]);
 const adapter:FormAdapter=async input=>{
  if(preview)return {ok:false,error:'Preview only: nothing has been sent or stored. Publish and connect a client website to receive inquiries.'};
  if(!endpoint||!config)return {ok:false,error:error||'The form is not connected yet. Please use the email contact option.'};
  const {name='',email='',phone='',message='',...details}=input.values;
  const fingerprint=JSON.stringify(input.values);
  const previous=pendingKeys.current.get(input.integration);
  const id=previous?.fingerprint===fingerprint?previous.id:crypto.randomUUID();pendingKeys.current.set(input.integration,{fingerprint,id});
  try{
   await submitWebsiteInquiry(endpoint,{name,email,phone,message,details,source:input.integration,sourcePage:location.origin+location.pathname},input.verificationToken??'',id,input.signal);
   pendingKeys.current.delete(input.integration);return {ok:true};
  }catch(failure){return {ok:false,error:failure instanceof Error?failure.message:'Your inquiry could not be saved.'};}
 };
 return <FormSubmissionProvider adapter={adapter} preview={preview} bookingUrl={config?.bookingUrl} verification={config?onToken=><TurnstileVerification siteKey={config.siteKey} onToken={onToken}/>:undefined}>
  {children}
 </FormSubmissionProvider>;
}
