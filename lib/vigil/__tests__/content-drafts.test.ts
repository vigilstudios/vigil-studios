import {describe,it,expect,vi} from 'vitest';
import {draftRecordIds,savedDraftRecords,sameContent} from '../content/drafts';
import {payloadSchemas,type ContentRecord} from '../content/contract';
import {applyDraftDecision,type DraftGuard} from '../content/navigation';
const entry=(id:string,title=id):ContentRecord=>({id,slug:id,deleted:false,featured:false,data:payloadSchemas.gallery.parse({title})});
const published=[entry('one'),entry('two'),entry('three')];
describe('entry draft status',()=>{
 it('does not treat a whole published collection as drafts, even with a newer collection revision',()=>{expect(savedDraftRecords(structuredClone(published),published)).toEqual([]);});
 it('shows only saved changed/new entries and leaves untouched entries published',()=>{const saved=[entry('one','Edited'),entry('two'),entry('three'),entry('four')];expect(savedDraftRecords(saved,published).map(r=>r.id)).toEqual(['one','four']);});
 it('keeps unsaved changes out of the saved Drafts view',()=>{const current=[entry('one','Not yet saved'),...published.slice(1)];expect(draftRecordIds(current,published).has('one')).toBe(true);expect(savedDraftRecords(published,published)).toEqual([]);});
 it('flags actual ordering changes without flagging entries just because a new post was added',()=>{expect([...draftRecordIds([entry('new'),...published],published)]).toEqual(['new']);expect([...draftRecordIds([published[1],published[0],published[2]],published)]).toEqual(['two','one']);});
 it('distinguishes pending removal from an already trashed record',()=>{const removed={...published[0],deleted:true};expect(draftRecordIds([removed,...published.slice(1)],published).has('one')).toBe(true);expect(savedDraftRecords([removed,...published.slice(1)],published)).toEqual([]);expect(draftRecordIds([removed,...published.slice(1)],published.slice(1)).size).toBe(0);});
 it('does not invent differences from JSON key ordering',()=>{expect(sameContent({title:'Post',media:[]},{media:[],title:'Post'})).toBe(true);});
});
const guard=():DraftGuard=>({when:true,save:vi.fn().mockResolvedValue(true),publish:vi.fn().mockResolvedValue(true),discard:vi.fn(),release:vi.fn()});
describe('leave-page decisions',()=>{
 it('saves a draft before releasing navigation, without publishing',async()=>{const g=guard();expect(await applyDraftDecision([g],'draft')).toBe(true);expect(g.save).toHaveBeenCalledOnce();expect(g.publish).not.toHaveBeenCalled();expect(g.release).toHaveBeenCalledOnce();});
 it('publishes before releasing navigation',async()=>{const g=guard();expect(await applyDraftDecision([g],'publish')).toBe(true);expect(g.publish).toHaveBeenCalledOnce();expect(g.save).not.toHaveBeenCalled();expect(g.release).toHaveBeenCalledOnce();});
 it('leaves without writing and discards only local changes',async()=>{const g=guard();expect(await applyDraftDecision([g],'discard')).toBe(true);expect(g.discard).toHaveBeenCalledOnce();expect(g.save).not.toHaveBeenCalled();expect(g.publish).not.toHaveBeenCalled();});
 it('retains the page and changes after a failed save or publication',async()=>{for(const intent of ['draft','publish'] as const){const g=guard();g[intent==='draft'?'save':'publish']=vi.fn().mockResolvedValue(false);expect(await applyDraftDecision([g],intent)).toBe(false);expect(g.release).not.toHaveBeenCalled();expect(g.discard).not.toHaveBeenCalled();}});
 it('does not abandon a pending upload or save',async()=>{const g={...guard(),busy:true};await expect(applyDraftDecision([g],'discard')).rejects.toThrow('Finish');expect(g.discard).not.toHaveBeenCalled();expect(g.release).not.toHaveBeenCalled();});
});
