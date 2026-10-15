/** Fit captured posters to the same 1600px bound as normalized Content Hub images. */
export function posterDimensions(width:number,height:number){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Wait for the video to load before choosing a frame.');
 const scale=Math.min(1,1600/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function posterSeekTime(time:number,duration:number){
 if(!Number.isFinite(time)||!Number.isFinite(duration)||duration<=0)return 0;
 return Math.max(0,Math.min(time,Math.max(0,duration-0.001)));
}
export function posterTimeLabel(time:number){
 const hundredths=Math.round((Number.isFinite(time)?Math.max(0,time):0)*100);
 return `${Math.floor(hundredths/6000)}:${(hundredths%6000/100).toFixed(2).padStart(5,'0')}`;
}
/** Capture only on explicit confirmation; no video re-upload or server video processing. */
export async function captureVideoPoster(video:HTMLVideoElement):Promise<File>{
 if(video.seeking||video.readyState<2)throw new Error('Wait for this frame to finish loading.');
 video.pause();const capturedTime=video.currentTime;
 const size=posterDimensions(video.videoWidth,video.videoHeight),canvas=document.createElement('canvas');
 canvas.width=size.width;canvas.height=size.height;
 const context=canvas.getContext('2d');if(!context)throw new Error('Your browser could not create a poster. Choose one from Files or upload an image.');
 try{context.drawImage(video,0,0,size.width,size.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
  if(!blob||!blob.size||blob.size>3*1024*1024)throw new Error('Frame could not be prepared');
  return new File([blob],`video-poster-${Math.round(capturedTime*1000)}ms.jpg`,{type:'image/jpeg'});
 }catch{throw new Error('This frame could not be captured. Try another moment, choose a poster from Files, or upload an image.');}
}
