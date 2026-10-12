import { getContactConfig, loadTurnstile, submitWebsiteInquiry } from "./browser";
/** Bind only explicitly marked client forms. Catalogue examples retain their own demo handlers. */
export async function mountContactForm(form:HTMLFormElement,endpoint:string):Promise<()=>void>{
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.appendChild(status);
 const button=form.querySelector<HTMLButtonElement>('button[type="submit"]');
 const widget=document.createElement('div');form.insertBefore(widget,status);
 let canceled=false,token='',widgetId:string|undefined,key=crypto.randomUUID(),fingerprint='',pending=false;
 const listener=async(event:SubmitEvent)=>{
  event.preventDefault();event.stopImmediatePropagation();if(pending)return;
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  const values={name:String(data.name??''),email:String(data.email??''),phone:String(data.phone??''),message:String(data.message??data.notes??'Booking inquiry'),source:form.dataset.vigilSource??'inquiries',sourcePage:location.origin+location.pathname,
   details:Object.fromEntries(Object.entries(data).filter(([name])=>!['name','email','phone','message','notes','cf-turnstile-response'].includes(name)).slice(0,8).map(([name,value])=>[name,String(value).slice(0,500)]))};
  if(!values.name||!values.email){status.textContent='Please include your name and email.';return;}
  const current=JSON.stringify(values);if(current!==fingerprint){key=crypto.randomUUID();fingerprint=current;}
  pending=true;if(button)button.disabled=true;status.textContent='Sending your inquiry…';
  try{await submitWebsiteInquiry(endpoint,values,token,key,AbortSignal.timeout(15_000));status.textContent='Your inquiry was received. A booking is confirmed separately by the business.';form.reset();key=crypto.randomUUID();fingerprint='';}
  catch(error){status.textContent=error instanceof Error?error.message:'Please try again or use email.';}
  finally{pending=false;if(button)button.disabled=false;token='';if(widgetId)window.turnstile?.reset(widgetId);}
 };
 form.addEventListener('submit',listener,true);
 try{
  const config=await getContactConfig(endpoint),api=await loadTurnstile();if(canceled)return()=>{};
  widgetId=api.render(widget,{sitekey:config.siteKey,action:'contact',callback:(value:string)=>{token=value;},'expired-callback':()=>{token='';},'error-callback':()=>{token='';status.textContent='Verification unavailable. Please use email.';}});
  if(config.bookingUrl){const link=document.createElement('a');link.href=config.bookingUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Choose a time ↗';status.after(link);}
 }catch{status.textContent='This form is not connected yet. Please use the email contact option.';if(button)button.disabled=true;}
 return()=>{canceled=true;form.removeEventListener('submit',listener,true);if(widgetId)window.turnstile?.remove(widgetId);widget.remove();status.remove();};
}
