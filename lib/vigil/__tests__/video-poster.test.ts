import {afterEach,describe,it,expect,vi} from 'vitest';
import {captureVideoPoster,posterDimensions,posterSeekTime,posterTimeLabel} from '@/lib/vigil/content/video-poster';
afterEach(()=>vi.unstubAllGlobals());
function fixture({tainted=false,blob=new Blob(['jpeg-bytes'],{type:'image/jpeg'}),readyState=4,seeking=false}:{tainted?:boolean;blob?:Blob|null;readyState?:number;seeking?:boolean}={}){
 const drawImage=vi.fn(()=>{if(tainted)throw new DOMException('Private signed URL must not leak','SecurityError');}),toBlob=vi.fn((callback:(blob:Blob|null)=>void)=>callback(blob));
 const canvas={width:0,height:0,getContext:()=>({drawImage}),toBlob};
 vi.stubGlobal('document',{createElement:()=>canvas});
 const video={videoWidth:1080,videoHeight:1920,readyState,seeking,currentTime:12.5,pause:vi.fn()} as unknown as HTMLVideoElement;
 return {video,canvas,drawImage,toBlob};
}
describe('video frame posters',()=>{
 it('captures a paused selected portrait frame as a bounded JPEG without changing the source',async()=>{const {video,canvas,drawImage,toBlob}=fixture();const file=await captureVideoPoster(video);expect(canvas).toMatchObject({width:900,height:1600});expect(drawImage).toHaveBeenCalledWith(video,0,0,900,1600);expect(toBlob).toHaveBeenCalledWith(expect.any(Function),'image/jpeg',0.88);expect(file.name).toBe('video-poster-12500ms.jpg');expect(file.type).toBe('image/jpeg');expect(await file.text()).toBe('jpeg-bytes');expect(video.currentTime).toBe(12.5);expect(video.pause).toHaveBeenCalledOnce();});
 it.each([{readyState:1},{seeking:true}])('rejects unloaded or seeking video before drawing',async options=>{const {video,drawImage}=fixture(options);await expect(captureVideoPoster(video)).rejects.toThrow('finish loading');expect(drawImage).not.toHaveBeenCalled();});
 it('handles cross-origin canvas refusal without exposing private addresses',async()=>{const {video}=fixture({tainted:true});await expect(captureVideoPoster(video)).rejects.toThrow('This frame could not be captured. Try another moment');});
 it.each([null,new Blob([]),new Blob([new Uint8Array(3*1024*1024+1)])])('rejects failed, empty and oversized image encoding',async blob=>{const {video}=fixture({blob});await expect(captureVideoPoster(video)).rejects.toThrow('could not be captured');});
 it('preserves aspect ratio and avoids enlarging small footage',()=>{expect(posterDimensions(3840,2160)).toEqual({width:1600,height:900});expect(posterDimensions(640,480)).toEqual({width:640,height:480});expect(()=>posterDimensions(0,1080)).toThrow();expect(()=>posterDimensions(Infinity,1080)).toThrow();});
 it('clamps seeks before the end to keep a decodable frame',()=>{expect(posterSeekTime(80,49.323)).toBeCloseTo(49.322);expect(posterSeekTime(-1,49)).toBe(0);expect(posterSeekTime(NaN,49)).toBe(0);expect(posterSeekTime(1,Infinity)).toBe(0);expect(posterSeekTime(12.5,49)).toBe(12.5);});
 it('shows precise, stable frame times',()=>{expect(posterTimeLabel(12.5)).toBe('0:12.50');expect(posterTimeLabel(61.25)).toBe('1:01.25');expect(posterTimeLabel(NaN)).toBe('0:00.00');expect(posterTimeLabel(59.999)).toBe('1:00.00');});
});
