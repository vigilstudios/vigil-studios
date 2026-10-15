'use client';
import {useRef,useState} from 'react';
import {Camera,X} from 'lucide-react';
import {captureVideoPoster,posterSeekTime,posterTimeLabel} from '@/lib/vigil/content/video-poster';
import './video-poster-picker.css';
export function VideoPosterPicker({src,onUse,onClose,onBusy}:{src:string;onUse:(file:File)=>Promise<boolean>;onClose:()=>void;onBusy:(busy:boolean)=>void}){
 const video=useRef<HTMLVideoElement>(null),captureLock=useRef(false),[duration,setDuration]=useState(0),[time,setTime]=useState(0),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function seek(value:number){const player=video.current;if(!player||!duration)return;const next=posterSeekTime(value,duration);player.pause();if(next===player.currentTime)return;setReady(false);setTime(next);player.currentTime=next;}
 async function confirmFrame(){
  if(captureLock.current||!video.current||!ready)return;captureLock.current=true;setBusy(true);onBusy(true);setError('');
  try{const file=await captureVideoPoster(video.current);if(await onUse(file))onClose();else setError('The poster could not be saved. Your current poster is unchanged. Try again.');}
  catch(e){setError(e instanceof Error?e.message:'This frame could not be captured. Try another frame.');}finally{captureLock.current=false;setBusy(false);onBusy(false);}
 }
 return <section className="video-poster-picker" aria-label="Choose frame from video" aria-busy={busy}>
  <div className="hub-toolbar"><div><h4>Choose a frame</h4><p>Scrub to a moment, then use it as this video’s poster.</p></div><button type="button" aria-label="Close frame picker" disabled={busy} onClick={onClose}><X size={16}/></button></div>
  <video ref={video} crossOrigin="anonymous" src={src} controls playsInline preload="auto" aria-label="Video frame preview" onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d)&&d>0)setDuration(d);else setError('This video does not have a seekable duration. Choose a poster from Files or upload an image.');}} onLoadedData={()=>setReady(true)} onSeeking={()=>setReady(false)} onSeeked={e=>{setTime(e.currentTarget.currentTime);setReady(e.currentTarget.readyState>=2);}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onError={()=>{setReady(false);setError('This video could not load for frame selection. Re-select it from Files, or choose a poster image.');}}/>
  <label className="video-poster-timeline">Video position<input type="range" min="0" max={Math.max(0,duration-0.001)} step="0.01" value={time} disabled={!duration||busy} onChange={e=>seek(Number(e.target.value))}/></label>
  <div className="video-poster-time"><output aria-live="off">{posterTimeLabel(time)} / {posterTimeLabel(duration)}</output><label>Time in seconds<input type="number" min="0" max={Math.max(0,duration-0.001)} step="0.01" value={Number(time.toFixed(2))} disabled={!duration||busy} onChange={e=>{if(e.target.value!=='')seek(Number(e.target.value));}}/></label></div>
  {error&&<p className="hub-error" role="alert">{error}</p>}
  {!ready&&!error&&<p role="status">Loading frame…</p>}
  <div className="hub-actions"><button type="button" className="hub-primary" disabled={!ready||!duration||busy} onClick={()=>void confirmFrame()}><Camera size={15} aria-hidden/>{busy?'Saving poster…':'Use this frame'}</button><button type="button" disabled={busy} onClick={onClose}>Cancel</button></div>
  <p className="video-poster-note">Only the selected image is added to Files when you confirm. Save or publish your post to keep the poster change.</p>
 </section>;
}
