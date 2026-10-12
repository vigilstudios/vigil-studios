/** Public browser adapter. No tenant, mail destination or secret is accepted. */
export type ContactConfig = {websiteId:string;siteKey:string;bookingUrl:string|null};
export type BrowserInquiry = {name:string;email:string;phone?:string;message:string;source?:string;sourcePage:string;details?:Record<string,string>};
type Turnstile = {
 render:(element:HTMLElement,options:Record<string,unknown>)=>string;
 reset:(id:string)=>void;remove:(id:string)=>void;
};
declare global { interface Window { turnstile?:Turnstile; VigilContact?:typeof publicContactApi } }
let turnstileLoading:Promise<Turnstile>|undefined;
export function loadTurnstile():Promise<Turnstile>{
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(turnstileLoading)return turnstileLoading;
 turnstileLoading=new Promise((resolve,reject)=>{
  const existing=document.querySelector<HTMLScriptElement>('script[data-vigil-turnstile]');
  const script=existing??document.createElement('script');script.dataset.vigilTurnstile='true';
  const fail=()=>{clearTimeout(timer);turnstileLoading=undefined;script.remove();reject(new Error('Verification could not load. Please try again or use email.'));};
  const ready=()=>{clearTimeout(timer);if(window.turnstile)resolve(window.turnstile);else fail();};
  script.addEventListener('load',ready,{once:true});script.addEventListener('error',fail,{once:true});
  const timer=setTimeout(fail,10_000);
  if(!existing){script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;document.head.appendChild(script);}
 });return turnstileLoading;
}
export function contactEndpoint(base:string,websiteId:string):string{
 const url=new URL(base);
 if(url.protocol!=='https:'||url.username||url.password||!/^https:\/\/www\.vigilstudios\.co\/?$/.test(base)||!/^[0-9a-f-]{36}$/i.test(websiteId))throw new Error('Invalid Vigil contact configuration.');
 return `${url.origin}/api/contact/${websiteId}`;
}
export async function getContactConfig(endpoint:string,signal?:AbortSignal):Promise<ContactConfig>{
 const response=await fetch(endpoint,{mode:'cors',credentials:'omit',cache:'no-store',signal});
 const result=await response.json();
 if(!response.ok||!result.siteKey)throw new Error('The form is not connected yet. Please use the email contact option.');
 return result;
}
export async function submitWebsiteInquiry(endpoint:string,input:BrowserInquiry,token:string,id:string,signal?:AbortSignal):Promise<void>{
 if(!token)throw new Error('Please complete the verification before sending.');
 const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',signal,
  headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,source:input.source??'inquiries',details:input.details??{},captchaToken:token,submissionId:id})});
 const result=await response.json();
 if(!response.ok||!result.ok)throw new Error(typeof result.error==='string'?result.error:'Your inquiry could not be saved. Please try again or use email.');
}
export const publicContactApi={loadTurnstile,getContactConfig,submitWebsiteInquiry,contactEndpoint};
