'use client';
/* eslint-disable @next/next/no-img-element -- Private library images use short-lived signed URLs. */
import {useEffect,useState} from 'react';
import {Film,Search,X} from 'lucide-react';
import type {ContentMedia} from '@/lib/vigil/content/contract';
import type {LibraryAsset} from '@/lib/vigil/content/library';
import {formatMb} from '@/lib/vigil/files';
import './content-media-picker.css';
export function ContentMediaPicker({website,collection,imagesOnly=false,onChoose,onClose,onBusy}:{website:string;collection:string;imagesOnly?:boolean;onChoose:(media:ContentMedia,url:string)=>void;onClose:()=>void;onBusy:(busy:boolean)=>void}){
 const [assets,setAssets]=useState<LibraryAsset[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState(''),[type,setType]=useState<'all'|'image'|'video'>(imagesOnly?'image':'all'),[choosing,setChoosing]=useState<string|null>(null);
 const endpoint=`/api/content/${website}/library?collection=${collection}`;
 useEffect(()=>{const controller=new AbortController();fetch(endpoint,{signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setAssets(data.assets);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Your Files library could not load.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[endpoint]);
 async function choose(asset:LibraryAsset){
  if(choosing)return;setChoosing(asset.id);onBusy(true);setError('');
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:asset.id})}),data=await response.json();if(!response.ok)throw new Error(data.error);onChoose(data.media,data.url);onClose();}
  catch(e){setError(e instanceof Error?e.message:'This file could not be selected.');}finally{setChoosing(null);onBusy(false);}
 }
 const shown=assets.filter(a=>(!imagesOnly||a.type==='image')&&(type==='all'||a.type===type)&&a.name.toLowerCase().includes(search.toLowerCase()));
 return <section className="content-media-picker" aria-label="Choose from Files" aria-busy={loading||Boolean(choosing)}>
  <div className="hub-toolbar"><div><h4>Choose from Files</h4><p>Reuse an upload from this website’s library. No duplicate file or extra storage.</p></div><button type="button" aria-label="Close file library" disabled={Boolean(choosing)} onClick={onClose}><X size={16}/></button></div>
  <div className="content-media-picker-tools"><label><span className="sr-only">Search your files</span><Search size={16} aria-hidden/><input type="search" placeholder="Search your files" value={search} onChange={e=>setSearch(e.target.value)}/></label>{!imagesOnly&&<label><span className="sr-only">Media type</span><select aria-label="Media type" value={type} onChange={e=>setType(e.target.value as typeof type)}><option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option></select></label>}</div>
  {error&&<p role="alert" className="hub-error">{error}</p>}
  {loading?<p role="status">Loading your Files library…</p>:<><p className="content-media-picker-count">{shown.length} {shown.length===1?'file':'files'} · {imagesOnly?'JPG, PNG, WebP and GIF':'JPG, PNG, WebP, GIF, MP4, MOV, WebM and M4V'}</p><div className="content-media-picker-grid">{shown.map(asset=><button type="button" key={asset.id} disabled={Boolean(choosing)} onClick={()=>void choose(asset)} aria-label={`Use ${asset.name}`}><span className="content-media-picker-thumbnail">{asset.type==='image'?<img src={asset.url} alt="" loading="lazy"/>:<Film size={30} aria-hidden/>}<span>{asset.type==='video'?'Video':'Image'}</span></span><strong>{asset.name}</strong><small>{choosing===asset.id?'Adding…':asset.size<1048576?`${Math.max(1,Math.round(asset.size/1024))} KB`:formatMb(asset.size)}</small></button>)}</div>{!shown.length&&<p>{search?'No files match your search.':'No compatible files here yet. Upload a file or choose another media type.'}</p>}</>}
 </section>;
}
