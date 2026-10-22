import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadHubView, type LeadHubData, type HubLink } from '@/components/vigil/LeadHubView';
import { readLeadFilters } from '../leads/presentation';
const Link:HubLink=props=><a {...props}/>;
const data:LeadHubData={leads:[],count:0,unread:0,page:1,sites:[{id:'site',name:'Scarlen Lopez',status:'building'}],settings:[{website_id:'site',organization_id:'org',enabled:true,allowed_origins:[],daily_limit:100,notification_email:'hello@example.com',booking_url:null,updated_at:'2026-10-22'}]};
function view(extra:Partial<LeadHubData>={},filters:Record<string,unknown>={}){return renderToStaticMarkup(<LeadHubView data={{...data,...extra}} filters={readLeadFilters(filters)} Link={Link} preferenceForms={{site:<p>Preference fields</p>}}/>);}
describe('Lead Hub states',()=>{
 it('never claims a building website is ready to receive inquiries',()=>{const html=view();expect(html).toContain('Website capture is waiting for launch');expect(html).not.toContain('Website inquiries connected');expect(html).toContain('Your next conversation starts here');});
 it('shows connected only for a live enabled website',()=>{expect(view({sites:[{id:'site',name:'Scarlen Lopez',status:'live'}]})).toContain('Website inquiries connected');expect(view({settings:[{...data.settings[0],enabled:false}],sites:[{id:'site',name:'Scarlen Lopez',status:'live'}]})).not.toContain('Website inquiries connected');});
 it('separates settings and preserves the preferences form',()=>{const html=view({}, {view:'settings'});expect(html).toContain('Preference fields');expect(html).toContain('Awaiting activation');expect(html).not.toContain('Search website inquiries');});
 it('distinguishes filtered, unread and out-of-range empty states',()=>{expect(view({}, {q:'missing'})).toContain('No inquiries match your search');expect(view({}, {view:'unread'})).toContain('You’re all caught up');const html=view({page:3,count:5},{page:'3'});expect(html).toContain('This page has no inquiries');expect(html).toContain('5 inquiries · no results on this page');expect(html).not.toContain('51–5');expect(html).toContain('Back to first page');});
});
