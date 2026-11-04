import {describe,expect,it,vi} from "vitest";
import {runInNewContext} from "node:vm";
import {expressHtml} from "../express/export";
import {readFileSync} from "node:fs";
const id="ba000000-0000-4000-8000-000000000021";
const html=expressHtml({kind:"html",variant:"Restaurant",industry:"Restaurant",example:"Example",description:"",accent:"#123456",html:readFileSync('lib/vigil/__tests__/fixtures/restaurant-booking-legacy.html','utf8')},"/runtime",false,undefined,id);
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)![1];
async function load(enabled:boolean,hash=""){
 const assets:{tag:string;src?:string;href?:string;onload?:()=>void}[]=[],callbacks:(()=>void)[]=[],connect=vi.fn(),slot={};
 const fetcher=vi.fn(async()=>({ok:enabled,json:async()=>({services:[{id:"service"}]})}));
 const document={addEventListener:(_event:string,callback:()=>void)=>callbacks.push(callback),querySelectorAll:(selector:string)=>selector.includes('booking-slot')?[slot]:[],createElement:(tag:string)=>({tag}),head:{appendChild:(node:typeof assets[number])=>{assets.push(node);node.onload?.();}}};
 runInNewContext(script,{document,location:{hash},fetch:fetcher,AbortSignal,VigilBookings:{connect},VigilContact:{mountContactForm:vi.fn()}});
 callbacks.forEach(callback=>callback());await new Promise(resolve=>setImmediate(resolve));
 return {assets,fetcher,connect,slot};
}
describe("optional Express booking loader",()=>{
 it("leaves contact-only visitors without a booking script download",async()=>{const result=await load(false);expect(result.fetcher).toHaveBeenCalledOnce();expect(result.assets).toEqual([]);expect(result.connect).not.toHaveBeenCalled();});
 it("loads the shared component after authoritative server eligibility and activation",async()=>{const result=await load(true);expect(result.assets.map(a=>a.tag)).toEqual(["link","script"]);expect(result.connect).toHaveBeenCalledWith(result.slot,id,true);});
 it("keeps private management links available when new bookings are paused",async()=>{const result=await load(false,`#vigil-booking=${id}.${"a".repeat(64)}`);expect(result.fetcher).not.toHaveBeenCalled();expect(result.connect).toHaveBeenCalledWith(result.slot,id,true);});
});
