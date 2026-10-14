'use client';
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode,type MouseEvent,type FormEvent} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import './draft-navigation.css';
import {applyDraftDecision,type DraftGuard} from '@/lib/vigil/content/navigation';
export type {DraftGuard} from '@/lib/vigil/content/navigation';
type Navigation={request:(action:()=>void)=>void;register:(guard:DraftGuard)=>()=>void};
const immediate:Navigation={request:action=>action(),register:()=>()=>{}};
const NavigationContext=createContext<Navigation>(immediate);
export function useDraftNavigation(){return useContext(NavigationContext);}
export function useDraftGuard(guard:DraftGuard){const {register}=useDraftNavigation();useEffect(()=>guard.when?register(guard):undefined,[register,guard]);}
/** Protects links, browser history, collection/site switches and sign-out before leaving authoring. */
export function DraftNavigationProvider({children}:{children:ReactNode}){
 const router=useRouter(),pathname=usePathname(),guards=useRef(new Set<DraftGuard>()),locationRef=useRef<{url:string;state:unknown}|null>(null),dialog=useRef<HTMLDialogElement>(null);
 const [destination,setDestination]=useState<{action:()=>void}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useCallback((action:()=>void)=>{if(!guards.current.size){action();return;}setError('');setDestination({action});},[]);
 const register=useCallback((guard:DraftGuard)=>{guards.current.add(guard);locationRef.current={url:location.href,state:history.state};return()=>{guards.current.delete(guard);};},[]);
 const context=useMemo(()=>({request,register}),[request,register]);
 useEffect(()=>{locationRef.current={url:location.href,state:history.state};},[pathname]);
 useEffect(()=>{if(destination&&!dialog.current?.open)dialog.current?.showModal();else if(!destination&&dialog.current?.open)dialog.current.close();},[destination]);
 useEffect(()=>{
  const unload=(event:BeforeUnloadEvent)=>{if(guards.current.size){event.preventDefault();event.returnValue='';}};
  // popstate itself cannot be cancelled. Restore the current entry before Next handles it,
  // then resume the requested history traversal only after an explicit dialog decision.
  const pop=(event:PopStateEvent)=>{const source=locationRef.current;if(!guards.current.size||!source||source.url===location.href){locationRef.current={url:location.href,state:history.state};return;}event.stopImmediatePropagation();history.pushState(source.state,'',source.url);request(()=>history.back());};
  window.addEventListener('beforeunload',unload);window.addEventListener('popstate',pop,true);
  return()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('popstate',pop,true);};
 },[request]);
 function captureLink(event:MouseEvent<HTMLDivElement>){
  if(!guards.current.size||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const anchor=(event.target as Element).closest('a[href]') as HTMLAnchorElement|null;
  if(!anchor||anchor.target&&anchor.target!=='_self'||anchor.hasAttribute('download'))return;
  const url=new URL(anchor.href);if(!['http:','https:'].includes(url.protocol)||url.origin===location.origin&&url.pathname.startsWith('/api/'))return;
  if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)return;
  event.preventDefault();request(()=>{if(url.origin===location.origin)router.push(`${url.pathname}${url.search}${url.hash}`);else location.assign(url.href);});
 }
 function captureSignout(event:FormEvent<HTMLDivElement>){const form=event.target as HTMLFormElement;if(guards.current.size&&new URL(form.action,location.href).pathname==='/auth/signout'){event.preventDefault();request(()=>form.requestSubmit());}}
 function cancel(){if(!busy)setDestination(null);}
 async function decide(intent:'draft'|'publish'|'discard'){
  if(!destination||busy)return;setBusy(true);setError('');
  try{
   const active=[...guards.current];
   if(!await applyDraftDecision(active,intent)){setError('Your changes could not be saved. Keep editing to check the fields, or try again.');return;}guards.current.clear();setDestination(null);destination.action();
  }catch(failure){setError(failure instanceof Error?failure.message:'Your changes could not be saved. You are still on this page.');}finally{setBusy(false);}
 }
 return <NavigationContext.Provider value={context}><div className="contents" onClickCapture={captureLink} onSubmitCapture={captureSignout}>{children}</div><dialog ref={dialog} className="draft-leave-dialog" aria-labelledby="draft-leave-title" aria-describedby="draft-leave-description" onCancel={e=>{e.preventDefault();cancel();}}><h2 id="draft-leave-title">Keep your changes?</h2><p id="draft-leave-description">Your changes have not been published. Save a private draft, publish your current changes, or leave without saving new changes.</p>{error&&<p className="draft-leave-error" role="alert">{error}</p>}<div className="draft-leave-actions"><button type="button" className="btn-secondary" disabled={busy} onClick={()=>void decide('draft')}>Save draft and leave</button><button type="button" className="btn-primary" disabled={busy} onClick={()=>void decide('publish')}>Publish and leave</button><button type="button" className="btn-secondary" disabled={busy} onClick={()=>void decide('discard')}>Leave without saving</button></div><button type="button" className="draft-keep-editing" disabled={busy} autoFocus onClick={cancel}>{busy?'Saving…':'Keep editing'}</button></dialog></NavigationContext.Provider>;
}
