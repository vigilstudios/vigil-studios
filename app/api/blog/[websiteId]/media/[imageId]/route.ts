import {z} from 'zod';
import {publicWebsiteBlog} from '@/lib/vigil/blog/http';
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string;imageId:string}>}){
 const {websiteId,imageId}=await params,url=new URL(request.url);
 if(!z.string().uuid().safeParse(imageId).success||!url.searchParams.get('slug'))return new Response('Image unavailable.',{status:404});
 const response=await publicWebsiteBlog(request,websiteId,undefined,false);
 if(!response.ok)return new Response('Image unavailable.',{status:response.status,headers:{'Cache-Control':'no-store'}});
 const data=await response.json() as {posts:{images?:{id:string;url:string}[]}[]};
 const image=data.posts[0]?.images?.find(image=>image.id===imageId);
 return image?new Response(null,{status:302,headers:{Location:image.url,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):new Response('Image unavailable.',{status:404,headers:{'Cache-Control':'no-store'}});
}
