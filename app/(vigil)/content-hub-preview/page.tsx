import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/vigil/auth/session';
import { AppShell } from '@/components/vigil/AppShell';
import { AccountBlock } from '@/components/vigil/AccountBlock';
import { ClientContentPreview } from './ClientContentPreview';
import '../dashboard/content/content.css';
export const metadata = { title: 'Client Content Hub preview', robots: { index: false, follow: false } };
export default async function ContentHubPreview({searchParams}:{searchParams:Promise<{tab?:string}>}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const viewer = await requireStaff('/content-hub-preview');
  const {tab}=await searchParams;
  return <AppShell homeHref="/content-hub-preview" workspace="Client preview" workspaceBrand={{name:'Studio demo',iconUrl:null}} account={<AccountBlock name={viewer.profile.full_name} email={viewer.user.email??''} crossLink={{href:'/admin/lab',label:'Back to Lab'}}/>} groups={[{items:[{href:'/dashboard',label:'Overview',icon:'overview'}]},{id:'website',label:'Website',collapsible:true,items:[{href:'/content-hub-preview',label:'Content Hub',icon:'blog'},{href:'/dashboard/files',label:'Files',icon:'files'}]}]}>
    <ClientContentPreview initialModule={tab==='team'?'team':'products'}/>
  </AppShell>;
}
