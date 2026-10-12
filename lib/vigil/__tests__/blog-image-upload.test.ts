import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {normalizeBlogImage,boundedImageForm} from '../blog/image-upload';
import {BLOG_IMAGE_MAX_BYTES,blogMediaSchema,imageInBlock,referencedImages} from '../blog/media-contract';
async function photo(format:'png'|'jpeg'|'webp',width=64,height=32){return sharp({create:{width,height,channels:3,background:'#ffeeff'}}).withMetadata()[format]().toBuffer();}
function file(bytes:Uint8Array,type:string){return new File([Uint8Array.from(bytes).buffer],'photo',{type});}
describe('Blog image upload safety',()=>{
 it.each(['png','jpeg','webp'] as const)('decodes %s and strips metadata into WebP',async format=>{const input=await photo(format);expect((await sharp(input).metadata()).icc).toBeDefined();const output=await normalizeBlogImage(file(input,'image/'+format));const meta=await sharp(output.data).metadata();expect(meta.format).toBe('webp');expect(meta.icc).toBeUndefined();expect(meta.exif).toBeUndefined();expect(output.width).toBe(64);expect(output.height).toBe(32);});
 it('caps dimensions without stretching',async()=>{const output=await normalizeBlogImage(file(await photo('png',2000,1000),'image/png'));expect([output.width,output.height]).toEqual([1600,800]);});
 it('rejects executable/vector uploads',async()=>{await expect(normalizeBlogImage(new File(['<svg onload="alert(1)"/>'],'photo.svg',{type:'image/svg+xml'}))).rejects.toThrow('JPG, PNG or WebP');});
 it('checks the decoded format rather than trusting the MIME label',async()=>{await expect(normalizeBlogImage(file(await photo('png'),'image/jpeg'))).rejects.toThrow('could not be read');});
 it('rejects corrupt and oversized images',async()=>{await expect(normalizeBlogImage(new File(['not an image'],'fake.png',{type:'image/png'}))).rejects.toThrow('could not be read');await expect(normalizeBlogImage(new File([new ArrayBuffer(BLOG_IMAGE_MAX_BYTES+1)],'huge.png',{type:'image/png'}))).rejects.toThrow('under 3 MB');});
 it('bounds request bytes even with an absent content-length',async()=>{const req=new Request('https://vigil.test/upload',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=test'},body:new ArrayBuffer(BLOG_IMAGE_MAX_BYTES+65537)});await expect(boundedImageForm(req)).rejects.toThrow('smaller than 3 MB');});
 it('reads one bounded multipart upload',async()=>{const form=new FormData();form.set('image',file(await photo('png'),'image/png'));const decoded=await boundedImageForm(new Request('https://vigil.test/upload',{method:'POST',body:form}));expect(decoded.get('image')).toBeInstanceOf(File);});
 it('selects only the cover and referenced inline images for a public article',()=>{const a='ba000000-0000-4000-8000-000000000041',b='ba000000-0000-4000-8000-000000000042',c='ba000000-0000-4000-8000-000000000043';const media={cover:a,images:[a,b,c].map(id=>({id,alt:'Photo',caption:''}))};expect(referencedImages(`## Heading\n\n[[image:${b}]]`,media).map(i=>i.id)).toEqual([a,b]);expect(imageInBlock('https://other.example/a.jpg')).toBeNull();expect(blogMediaSchema.safeParse({...media,cover:'ba000000-0000-4000-8000-000000000044'}).success).toBe(false);});
});
