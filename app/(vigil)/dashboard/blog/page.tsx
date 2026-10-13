import {redirect} from 'next/navigation';
export default async function BlogDashboard({searchParams}:{searchParams:Promise<{website?:string}>}){const {website}=await searchParams;redirect(`/dashboard/content${website?`?website=${encodeURIComponent(website)}`:''}`);}
