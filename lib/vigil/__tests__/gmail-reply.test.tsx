import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FakeAdmin } from './fake-admin';
import type { OrgContext } from '../auth/session';
const mocks=vi.hoisted(()=>({admin:vi.fn(),client:vi.fn(),connection:vi.fn(),access:vi.fn(),getDraft:vi.fn(),createDraft:vi.fn(),rate:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}));
vi.mock('@/lib/vigil/gmail/connection',()=>({gmailConnection:mocks.connection}));
vi.mock('@/lib/vigil/rate-limit',()=>({enforceRateLimit:mocks.rate,limitKey:(scope:string,user:string)=>`${scope}:${user}`}));
vi.mock('@/lib/vigil/gmail/provider',()=>({gmailAccessToken:mocks.access,getGmailDraft:mocks.getDraft,createGmailDraft:mocks.createDraft,gmailDraftUrl:(email:string,draft:{message:{threadId:string}})=>`https://mail.google.com/mail/?authuser=${email}#drafts/${draft.message.threadId}`}));
import { prepareGmailReply } from '../gmail/reply';
import { GmailConnectionPanel } from '@/components/vigil/GmailConnectionPanel';
const user='ce500000-0000-4000-8000-000000000001',lead='ce500000-0000-4000-8000-000000000031';
const ctx={user:{id:user},organization:{id:'org-a'},staffRole:null,role:'member'} as OrgContext;
const draft={id:'r_draft',message:{threadId:'abc123'}};
let db:FakeAdmin, rpc:ReturnType<typeof vi.fn>;
beforeEach(()=>{
 vi.clearAllMocks();db=new FakeAdmin({leads:[{id:lead,organization_id:'org-a',contact:{name:'Maya',email:'visitor@example.com'},message:'Original inquiry',received_at:'2026-10-23T03:00:00Z'},{id:'private-lead',organization_id:'org-b'}]});
 rpc=vi.fn(async(name:string)=>({data:name==='gmail_draft_lock'||name==='finish_gmail_draft',error:null}));
 mocks.client.mockResolvedValue({from:db.from.bind(db)});mocks.admin.mockReturnValue({from:db.from.bind(db),rpc});mocks.connection.mockResolvedValue({email:'mine@example.com',refreshToken:'private-refresh',connectedAt:'2026-10-23T03:00:00Z'});mocks.access.mockResolvedValue('private-access');mocks.getDraft.mockResolvedValue(null);mocks.createDraft.mockResolvedValue(draft);
});
describe('Tenant-scoped Gmail reply preparation',()=>{
 it('resolves only the selected organization before reading the signed-in user credential',async()=>{
  await expect(prepareGmailReply(ctx,'private-lead')).rejects.toThrow('not available');expect(mocks.connection).not.toHaveBeenCalled();expect(mocks.createDraft).not.toHaveBeenCalled();
 });
 it('honors an RLS-denied lead even when the service client could read it',async()=>{
  const denied=new FakeAdmin({leads:[]});mocks.client.mockResolvedValue({from:denied.from.bind(denied)});
  await expect(prepareGmailReply(ctx,lead)).rejects.toThrow('not available');expect(mocks.admin).not.toHaveBeenCalled();expect(mocks.connection).not.toHaveBeenCalled();
 });
 it('creates an addressed draft with original inquiry and stores provider ids under the same user',async()=>{
  expect(await prepareGmailReply(ctx,lead)).toContain('#drafts/abc123');expect(mocks.connection).toHaveBeenCalledWith(user,true);
  const mime=Buffer.from(mocks.createDraft.mock.calls[0][1],'base64url').toString();expect(mime).toContain('To: visitor@example.com');expect(mime).toContain('From: mine@example.com');
  expect(rpc).toHaveBeenCalledWith('finish_gmail_draft',expect.objectContaining({p_user:user,p_lead:lead,p_draft:'r_draft',p_thread:'abc123',p_connected_at:'2026-10-23T03:00:00Z'}));
  expect(rpc).toHaveBeenLastCalledWith('gmail_draft_lock',expect.objectContaining({p_user:user,p_lead:lead,p_release:true}));
 });
 it('reopens the existing draft without replacing edits or creating another',async()=>{
  db.rows('provider_links').push({provider:'other',resource_kind:`gmail_draft_${user.replace(/-/g,'')}`,entity_type:'lead',entity_id:lead,external_id:'existing'});mocks.getDraft.mockResolvedValue(draft);
  await prepareGmailReply(ctx,lead);expect(mocks.getDraft).toHaveBeenCalledWith('private-access','existing');expect(mocks.createDraft).not.toHaveBeenCalled();
 });
 it('never reuses another user’s draft mapping',async()=>{
  db.rows('provider_links').push({provider:'other',resource_kind:'gmail_draft_other',entity_type:'lead',entity_id:lead,external_id:'private'});
  await prepareGmailReply(ctx,lead);expect(mocks.getDraft).not.toHaveBeenCalled();expect(mocks.createDraft).toHaveBeenCalledOnce();
 });
 it('requires a connected personal account',async()=>{mocks.connection.mockResolvedValue(null);await expect(prepareGmailReply(ctx,lead)).rejects.toThrow('Connect Gmail');expect(mocks.createDraft).not.toHaveBeenCalled();});
 it('blocks concurrent draft creation',async()=>{rpc.mockResolvedValueOnce({data:false,error:null});await expect(prepareGmailReply(ctx,lead)).rejects.toThrow('already being prepared');expect(mocks.createDraft).not.toHaveBeenCalled();});
 it('releases its lease after provider failure without retrying a possibly created draft',async()=>{mocks.createDraft.mockRejectedValue(new Error('uncertain timeout'));await expect(prepareGmailReply(ctx,lead)).rejects.toThrow('timeout');expect(mocks.createDraft).toHaveBeenCalledOnce();expect(rpc).toHaveBeenLastCalledWith('gmail_draft_lock',expect.objectContaining({p_release:true}));});
 it('does not claim success if the connection was removed or replaced mid-request',async()=>{rpc.mockImplementation(async(name:string)=>({data:name!=='finish_gmail_draft',error:null}));await expect(prepareGmailReply(ctx,lead)).rejects.toThrow('Open Gmail Drafts');});
});
describe('Gmail connection UI',()=>{
 it('fails closed without Google client configuration',()=>{const html=renderToStaticMarkup(<GmailConnectionPanel status={{configured:false,email:null}} disconnectControl={null}/>);expect(html).toContain('disabled=""');expect(html).toContain('Google connection setup is required');expect(html).not.toContain('Connected as');});
 it('identifies the connected account and draft-only application behavior',()=>{const html=renderToStaticMarkup(<GmailConnectionPanel status={{configured:true,email:'mine@example.com'}} disconnectControl={<button>Disconnect Gmail</button>}/>);expect(html).toContain('Connected as mine@example.com');expect(html).toContain('Disconnect Gmail');expect(html).toContain('does not read your inbox or send replies automatically');});
});
