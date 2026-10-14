import {describe,it,expect} from 'vitest';
import {isWebsiteLive,showWebsitePreview} from '../presenters';
import {operationalChecks,checkSummary,releaseSummary} from '../site-observability';
describe('website preview lifecycle',()=>{
 it('requires both launch status and a public URL before hiding preview',()=>{
  const launched={status:'live',live_url:'https://example.com'},review={status:'building',live_url:null};
  expect(isWebsiteLive(launched)).toBe(true);
  expect(isWebsiteLive({...launched,live_url:null})).toBe(false);
  expect(isWebsiteLive({...launched,status:'building'})).toBe(false);
  expect(showWebsitePreview([launched])).toBe(false);
  expect(showWebsitePreview([launched,review])).toBe(true);
  expect(showWebsitePreview([])).toBe(true);
  expect(showWebsitePreview([{...launched,status:'suspended'}])).toBe(true);
 });
});
describe('recorded operational charts',()=>{
 it('never infers SSL or availability from launch or missing checks',()=>{
  const checks=operationalChecks({health_ok:true,last_health_at:null},null);
  expect(checkSummary(checks)).toEqual({passed:0,attention:0,pending:3,total:3});
 });
 it('distinguishes failed checks from unmeasured checks',()=>{
  const checks=operationalChecks({health_ok:true,last_health_at:'2026-10-14T00:00:00Z'},{dns_ok:false,ssl_ok:null});
  expect(checkSummary(checks)).toEqual({passed:1,attention:1,pending:1,total:3});
 });
 it('does not count preview builds or in-progress releases as production successes',()=>{
  expect(releaseSummary([{environment:'preview',status:'ready'},{environment:'production',status:'ready'},{environment:'production',status:'error'},{environment:'production',status:'building'},{environment:'production',status:'canceled'}])).toEqual({ready:1,error:1,pending:2,total:4});
  expect(releaseSummary([])).toEqual({ready:0,error:0,pending:0,total:0});
 });
});
