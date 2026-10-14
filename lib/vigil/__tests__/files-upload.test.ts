import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {fileUploadError} from '../file-upload-error';
import {filterFiles,MB,validateFileBatch} from '../files';
const transport=vi.hoisted(()=>({options:null as null|{endpoint:string;chunkSize:number;onSuccess:()=>void;onError:(error:Error)=>void;onProgress:(sent:number,total:number)=>void},error:null as Error|null}));
vi.mock('tus-js-client',()=>({Upload:class{constructor(_file:unknown,options:typeof transport.options){transport.options=options;}start(){if(transport.error)transport.options!.onError(transport.error);else{transport.options!.onProgress(95_274_457,95_274_457);transport.options!.onSuccess();}}}}));
import {storageUploadEndpoint,uploadToBucket} from '../storage-upload';
describe('project Files upload and filtering',()=>{
 beforeEach(()=>{transport.options=null;transport.error=null;vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://project-ref.supabase.co');});
 it('accepts the supplied MOV within the existing account allowance and room',()=>{
  expect(validateFileBatch([{name:'Video 1 (Night of Laughter).MOV',type:'video/quicktime',size:95_274_457}],{maxCount:80,maxFileBytes:500*MB,maxTotalBytes:10240*MB,videoEnabled:true},{count:77,bytes:477_208_190})).toEqual([]);
 });
 it('filters mixed media without changing order or excluding uncommon photo/video types',()=>{
  const files=[{content_type:'application/pdf',id:1},{content_type:'image/heic',id:2},{content_type:'video/quicktime',id:3},{content_type:'image/svg+xml',id:4},{content_type:'video/x-m4v',id:5},{content_type:'application/octet-stream',id:6}];
  expect(filterFiles(files,'images').map(f=>f.id)).toEqual([2,4]);expect(filterFiles(files,'videos').map(f=>f.id)).toEqual([3,5]);expect(filterFiles(files,'documents').map(f=>f.id)).toEqual([1]);expect(filterFiles(files,'other').map(f=>f.id)).toEqual([6]);expect(filterFiles(files,'all')).toBe(files);
 });
 it('explains the actual TUS 413 without exposing URLs or authentication details',()=>{
  const reason=fileUploadError({message:'tus POST https://private.example?token=secret Maximum size exceeded',originalResponse:{getStatus:()=>413}});
  expect(reason).toMatch(/upload service rejected.*size/);expect(reason).not.toMatch(/secret|https:/);
 });
 it('distinguishes expired sessions, permission and network errors',()=>{
  expect(fileUploadError({statusCode:'401'})).toMatch(/session expired/);expect(fileUploadError({status:403})).toMatch(/permission/);expect(fileUploadError(new Error('Failed to fetch'))).toMatch(/connection was interrupted/);
 });
 it('uses the direct hosted storage hostname while preserving custom and local endpoints',()=>{
  expect(storageUploadEndpoint('https://project-ref.supabase.co/')).toBe('https://project-ref.storage.supabase.co/storage/v1/upload/resumable');expect(storageUploadEndpoint('http://127.0.0.1:54321')).toBe('http://127.0.0.1:54321/storage/v1/upload/resumable');expect(storageUploadEndpoint('https://storage.example.com')).toBe('https://storage.example.com/storage/v1/upload/resumable');
 });
 it('uploads the original MOV size in 6 MiB chunks through TUS and reports completion',async()=>{
  const client={auth:{getSession:vi.fn().mockResolvedValue({data:{session:{access_token:'test-token'}}})}} as unknown as SupabaseClient,progress=vi.fn();
  await uploadToBucket(client,'project-assets','org/project/video.mov',{size:95_274_457,type:'video/quicktime'} as File,progress);
  expect(transport.options?.endpoint).toBe('https://project-ref.storage.supabase.co/storage/v1/upload/resumable');expect(transport.options?.chunkSize).toBe(6*MB);expect(progress).toHaveBeenCalledWith(1);
 });
 it('keeps small file uploads on the standard private bucket path',async()=>{
  const standardUpload=vi.fn().mockResolvedValue({error:null}),from=vi.fn().mockReturnValue({upload:standardUpload}),client={storage:{from}} as unknown as SupabaseClient,progress=vi.fn(),file={size:1024,type:'image/png'} as File;
  await uploadToBucket(client,'project-assets','org/project/photo.png',file,progress);
  expect(from).toHaveBeenCalledWith('project-assets');expect(standardUpload).toHaveBeenCalledWith('org/project/photo.png',file,{contentType:'image/png',upsert:false});expect(progress).toHaveBeenCalledWith(1);expect(transport.options).toBeNull();
 });
 it('rejects large uploads with an expired session before contacting TUS',async()=>{
  const client={auth:{getSession:vi.fn().mockResolvedValue({data:{session:null}})}} as unknown as SupabaseClient;
  await expect(uploadToBucket(client,'project-assets','org/project/video.mov',{size:95_274_457,type:'video/quicktime'} as File)).rejects.toThrow(/session has expired/);expect(transport.options).toBeNull();
 });
 it('propagates a failed TUS request rather than pretending the file was uploaded',async()=>{
  const client={auth:{getSession:vi.fn().mockResolvedValue({data:{session:{access_token:'test-token'}}})}} as unknown as SupabaseClient;transport.error=new Error('Maximum size exceeded');
  await expect(uploadToBucket(client,'project-assets','org/project/video.mov',{size:95_274_457,type:'video/quicktime'} as File)).rejects.toThrow('Maximum size exceeded');
 });
});
