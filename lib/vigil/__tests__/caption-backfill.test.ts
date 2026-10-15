import{describe,it,expect}from'vitest';
// Operational helper is also consumed directly by the reviewed import command.
import{recoverPrimaryCaptions}from'../content/caption-backfill.mjs';
describe('recover imported primary captions',()=>{
 const original=[{id:'a',slug:'quirk',data:{title:'Quirk Haus',media:[{id:'video',caption:''},{id:'second',caption:'Existing second caption'}]}},{id:'b',slug:'new-post',data:{title:'New customer post',media:[{caption:''}]}},{id:'c',slug:'kofee',data:{title:'KOFEE',media:[{caption:'Customer-edited caption'}]}}];
 it('recovers reviewed legacy copy without changing titles, secondary media, unknown posts or customer edits',()=>{const result=recoverPrimaryCaptions(original,{quirk:'come for the little things',kofee:'Legacy copy'});expect(result.changes).toEqual(['a']);expect(result.records[0].data.media[0]).toEqual({id:'video',caption:'come for the little things'});expect(result.records[0].data.media[1]).toEqual(original[0].data.media[1]);expect(result.records[1]).toBe(original[1]);expect(result.records[2]).toBe(original[2]);expect(original[0].data.media[0].caption).toBe('');});
 it('is idempotent and ignores empty, unsupported and oversized source values',()=>{const first=recoverPrimaryCaptions(original,{quirk:'Original copy'});expect(recoverPrimaryCaptions(first.records,{quirk:'Original copy'}).changes).toEqual([]);for(const value of ['',42,'x'.repeat(401)])expect(recoverPrimaryCaptions(original,{quirk:value}).changes).toEqual([]);});
});
