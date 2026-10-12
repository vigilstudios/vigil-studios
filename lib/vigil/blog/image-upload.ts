import 'server-only';
import sharp from 'sharp';
import {BLOG_IMAGE_MAX_BYTES} from './media-contract';
import {ValidationError} from '../auth/errors';
export async function boundedImageForm(request:Request){
 const type=request.headers.get('content-type')??'';if(!type.startsWith('multipart/form-data;'))throw new ValidationError('Choose a photo to upload.');
 const cap=BLOG_IMAGE_MAX_BYTES+64*1024;if(Number(request.headers.get('content-length')??0)>cap)throw new ValidationError('Choose an image smaller than 3 MB.');
 if(!request.body)throw new ValidationError('Choose a photo.');const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>cap){await reader.cancel();throw new ValidationError('Choose an image smaller than 3 MB.');}chunks.push(value);}}finally{reader.releaseLock();}
 return new Response(Buffer.concat(chunks),{headers:{'content-type':type}}).formData();
}
export async function normalizeBlogImage(file:File){
 const types:Record<string,string>={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'};
 if(!types[file.type]||!file.size||file.size>BLOG_IMAGE_MAX_BYTES)throw new ValidationError('Choose a JPG, PNG or WebP image under 3 MB.');
 try{const bytes=Buffer.from(await file.arrayBuffer()),options={limitInputPixels:25000000,failOn:'error' as const};const meta=await sharp(bytes,options).metadata();if(meta.format!==types[file.type]||(meta.pages??1)>1)throw new Error('Invalid format');
 const {data,info}=await sharp(bytes,options).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
 if(data.byteLength>BLOG_IMAGE_MAX_BYTES)throw new Error('Too large');return {data,width:info.width,height:info.height};
 }catch{throw new ValidationError('That image could not be read. Export it as JPG, PNG or WebP and try again.');}
}
