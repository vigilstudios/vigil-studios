import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAdmin } from './fake-admin';
import { leadBackHref, leadHubHref, readLeadFilters, sourceLabel } from '../leads/presentation';
const mocks = vi.hoisted(() => ({ client: vi.fn(), context: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('@/lib/vigil/auth/session', () => ({ requireOrgContext: mocks.context, requireOrgContextOrThrow: mocks.context }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { getLeadHub, getLeadDetail } from '../queries/leads';
import { updateLead, addLeadNote, saveLeadPreferences } from '../actions/leads';
const id='ca000000-0000-4000-8000-000000000031', site='ca000000-0000-4000-8000-000000000021';
beforeEach(()=>{vi.clearAllMocks();mocks.context.mockResolvedValue({organization:{id:'org-a'},role:'owner',staffRole:null});});
function setup() {
 const fake=new FakeAdmin({leads:[{id,organization_id:'org-a',status:'new',source:'inquiries',read_at:null},{id:'read',organization_id:'org-a',status:'contacted',source:'inquiries',read_at:'2026-01-01'},{id:'private',organization_id:'org-b',status:'new',source:'inquiries',read_at:null}],websites:[{id:site,organization_id:'org-a'}]});
 const range=vi.fn(),search=vi.fn(),order=vi.fn();
 const client={from(table:string){const builder=fake.from(table);return Object.assign(builder,{range(start:number,end:number){range(start,end);return builder;},textSearch(...args:unknown[]){search(...args);return builder;},order(...args:unknown[]){order(...args);return builder;}});},rpc:vi.fn(async()=>({data:undefined,error:null}))};
 mocks.client.mockResolvedValue(client);return {fake,client,range,search,order};
}
describe('Lead Hub navigation',()=>{
 it('ignores duplicate and unsupported inputs and bounds page and search length',()=>{expect(readLeadFilters({q:['a','b'],status:'bad',source:'bad source',page:'-12',view:'bad'})).toEqual({q:'',status:'',source:'',page:1,view:'inbox'});expect(readLeadFilters({q:'x'.repeat(250),page:'999999',view:'unread'})).toMatchObject({q:'x'.repeat(200),page:10000,view:'unread'});expect(sourceLabel(null)).toBe('Website inquiry');});
 it('preserves filters and page through inquiry navigation',()=>{const href=leadHubHref({q:'brand & film',status:'new',source:'inquiries',view:'unread',page:2});expect(leadBackHref(href)).toBe(href);});
 it.each(['https://outside.example/dashboard/leads','//outside.example/dashboard/leads','javascript:alert(1)','/admin','/dashboard/leads/other'])('rejects external or unrelated back destination %s',value=>{expect(leadBackHref(value)).toBe('/dashboard/leads');});
});
describe('Lead Hub data and actions',()=>{
 it('keeps unread filtering tenant scoped with exact status/source and stable pagination',async()=>{const {range,search,order}=setup();const hub=await getLeadHub({view:'unread',status:'new',source:'inquiries',q:'  brand  ',page:'2'});expect(hub.leads.map(row=>row.id)).toEqual([id]);expect(hub.unread).toBe(1);expect(range).toHaveBeenCalledWith(25,49);expect(search).toHaveBeenCalledWith('search_document','brand',{type:'websearch',config:'simple'});expect(order.mock.calls).toEqual([['received_at',{ascending:false}],['id',{ascending:false}]]);});
 it('never exposes another organization’s detail',async()=>{setup();expect(await getLeadDetail('private')).toBeNull();});
 it('saves status and unread state only for the current organization',async()=>{const {fake}=setup();const form=new FormData();form.set('status','qualified');form.set('read','read');expect(await updateLead(id,form)).toMatchObject({ok:true});expect(fake.rows('leads')[0]).toMatchObject({status:'qualified',read_at:expect.any(String)});expect(fake.rows('leads')[2].status).toBe('new');});
 it('rejects invalid status and refuses inaccessible inquiry writes',async()=>{setup();const form=new FormData();form.set('status','invented');form.set('read','read');expect(await updateLead(id,form)).toMatchObject({ok:false});expect(await addLeadNote('ca000000-0000-4000-8000-000000000099',form)).toMatchObject({ok:false,code:'forbidden'});});
 it('saves notes via the existing RPC without touching notifications',async()=>{const {client}=setup();const form=new FormData();form.set('note','  Follow up Friday.  ');expect(await addLeadNote(id,form)).toMatchObject({ok:true});expect(client.rpc).toHaveBeenCalledWith('add_lead_note',{p_lead:id,p_note:'Follow up Friday.'});});
 it('keeps notification preferences owner/manager restricted and validates booking links',async()=>{const {client}=setup();const form=new FormData();form.set('recipient','hello@example.com');form.set('booking','http://localhost');expect(await saveLeadPreferences(site,form)).toMatchObject({ok:false});expect(client.rpc).not.toHaveBeenCalled();form.set('booking','https://calendly.com/example');expect(await saveLeadPreferences(site,form)).toMatchObject({ok:true});expect(client.rpc).toHaveBeenCalledWith('configure_website_contact',{p_website:site,p_recipient:'hello@example.com',p_booking:'https://calendly.com/example'});client.rpc.mockClear();mocks.context.mockResolvedValue({organization:{id:'org-a'},role:'member',staffRole:null});expect(await saveLeadPreferences(site,form)).toMatchObject({ok:false,code:'forbidden'});expect(client.rpc).not.toHaveBeenCalled();});
});
