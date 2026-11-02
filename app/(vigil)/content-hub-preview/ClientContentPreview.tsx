'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ContentHub} from '@/components/vigil/ContentHub';
import {type HubCollection,type EditorMediaServices} from '@/components/vigil/CollectionEditor';
import type {LibraryAsset} from '@/lib/vigil/content/library';
import {parseRecords,payloadSchemas,publicationIssues,type ContentRecord} from '@/lib/vigil/content/contract';
import type {saveContentCollection} from '@/lib/vigil/actions/content';
const website='de000000-0000-4000-8000-000000000001';
const uuid=(number:number)=>`de000000-0000-4000-8000-${String(number).padStart(12,'0')}`;
const exampleFiles:LibraryAsset[]=[
 {id:uuid(101),name:'Headphones — product photo.webp',type:'image',size:42000,url:'/design-engine-commerce/audio-headphones-640.webp',caption:''},
 {id:uuid(102),name:'Headphones — detail.webp',type:'image',size:34000,url:'/design-engine-commerce/audio-detail-240.webp',caption:''},
 {id:uuid(103),name:'Music player.webp',type:'image',size:39000,url:'/design-engine-commerce/audio-player-640.webp',caption:''},
];
export function clientPreviewCollections():HubCollection[]{
 const product=(n:number,title:string,price:string,description:string,files:number[]):ContentRecord=>({id:uuid(n),slug:`sample-product-${n}`,deleted:false,featured:n===11,data:payloadSchemas.products.parse({title,description,category:'Audio',priceLabel:price,providerRef:`sample-product-${n}`,media:files.map(number=>({id:uuid(number),type:'image',src:'',alt:title,caption:''}))})});
 const products=[product(11,'Studio headphones','$149','Over-ear headphones designed for focused listening.',[101,102]),product(12,'Portable music player','$89','A compact music player for listening on the move.',[103])];
 const team=[['Alex Morgan','Founder','Leads the studio and works closely with clients.'],['Sam Taylor','Design lead','Turns ideas into thoughtful customer experiences.'],['Jordan Lee','Client experience','Keeps projects moving and makes every detail clear.']].map(([title,role,description],index)=>({id:uuid(21+index),slug:`sample-member-${index+1}`,deleted:false,featured:false,data:payloadSchemas.team.parse({title,role,description})}));
 return [{id:uuid(2),key:'preview-products',module:'products',label:'Products',records:products,publishedRecords:structuredClone(products),revision:1,publishedRevision:1,editableFields:['title','description','category','priceLabel','media'],maxMedia:30,hasDetailLinks:false},{id:uuid(3),key:'preview-team',module:'team',label:'The team',records:team,publishedRecords:structuredClone(team),revision:1,publishedRevision:1,editableFields:['title','role','description','media'],maxMedia:1,hasDetailLinks:false}];
}
export function ClientContentPreview({initialModule='products'}:{initialModule?:'products'|'team'}){
 const [reset,setReset]=useState(0);
 return <div><p className="hub-featured-notice" role="status"><strong>Local client preview.</strong> These are fictional sample products and team members. Try editing, Files, uploads, drafts and publishing. Everything stays in this page; no real client or website is updated. Reload to reset.</p><PreviewSession key={reset} initialModule={initialModule}/><button type="button" className="btn-secondary mt-6" onClick={()=>setReset(value=>value+1)}>Reset sample content</button></div>;
}
function PreviewSession({initialModule}:{initialModule:'products'|'team'}){
 const [collections]=useState(clientPreviewCollections),files=useRef(exampleFiles.map(file=>({...file}))),urls=useRef<string[]>([]);
 useEffect(()=>()=>{urls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 const services=useMemo(()=>{
  const persist:typeof saveContentCollection=async(id,revision,input,intent)=>{
   const collection=collections.find(c=>c.id===id);if(!collection||collection.module==='blog')return {ok:false,error:'Unknown sample collection.'};
   try{const records=parseRecords(collection.module,input);if(intent==='publish'){const issues=publicationIssues(collection.module,records);if(issues.length)return {ok:false,error:issues[0]};}return {ok:true,data:{revision:revision+1}};}catch{return {ok:false,error:'Check your sample entry fields.'};}
  };
  const mediaServices:EditorMediaServices={
   library:{load:async()=>files.current,choose:async asset=>({media:{id:asset.id,type:asset.type,src:'',alt:asset.name,caption:asset.caption},url:asset.url})},
   upload:async file=>{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('This local preview supports JPG, PNG and WebP images.');
    if(file.size>3*1024*1024)throw Error('Choose an image smaller than 3 MB.');
    const id=crypto.randomUUID(),url=URL.createObjectURL(file);urls.current.push(url);files.current=[...files.current,{id,name:file.name,type:'image',size:file.size,url,caption:''}];
    return {media:{id,type:'image',src:'',alt:file.name,caption:''},url};
   },
  };
  return {persist,mediaServices};
 },[collections]);
 return <ContentHub initialModule={initialModule} sites={[{id:website,name:'Studio demo website',status:'live',access:true}]} selected={website} collections={collections} canWrite blog={null} previews={Object.fromEntries(exampleFiles.map(file=>[file.id,file.url]))} editorServices={services} exportHref={null}/>;
}
