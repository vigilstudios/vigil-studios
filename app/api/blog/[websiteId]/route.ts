import {publicWebsiteBlog} from '@/lib/vigil/blog/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{websiteId:string}>}){return publicWebsiteBlog(request,(await params).websiteId);}
