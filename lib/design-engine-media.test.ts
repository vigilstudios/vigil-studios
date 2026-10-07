import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mediaBriefs, briefForStudy } from "@/design-engine/preview/collection-005/fixtures";
import { mediaStudies, studyContract, validateStudyBrief } from "@/design-engine/preview/collection-005/studies";
import { MediaStudyArtwork } from "@/design-engine/preview/collection-005/Study";
import { DesignThemeProvider } from "@/design-engine/foundations/DesignThemeProvider";
import { designComponents } from "@/design-engine/registry/components";
import { collection004Review } from "@/design-engine/preview/collection-004/review";
import { readFileSync, statSync } from "node:fs";

describe("Collection 005 creative media contracts",()=>{
  it("renders all 52 adaptations with body semantics and separately registered approved implementations",()=>{
    expect(mediaStudies).toHaveLength(13);
    expect(new Set(mediaStudies.map(s=>s.id)).size).toBe(13);
    for(const s of mediaStudies) for(const [index,brief] of mediaBriefs.entries()){
      const b=briefForStudy(s.id,brief);
      expect(validateStudyBrief(s,b),`${s.id}/${brief.id}`).toEqual([]);
      const html=renderToStaticMarkup(createElement(DesignThemeProvider,{typography:s.typography[index],artDirection:s.art,motion:"none"},createElement(MediaStudyArtwork,{study:s,brief:b})));
      expect(html.match(/<h2\b/g)).toHaveLength(1);
      expect(html).not.toMatch(/<h1\b|autoplay|opacity:0|NaN|undefined/);
      expect(html).toContain(brief.brand);
      expect(studyContract(s).category).toBe("portfolio");
      expect(designComponents.some(c=>"sourceConcept" in c && c.sourceConcept===s.id)).toBe(s.id !== "M03");
    }
    expect(mediaStudies.filter(s=>s.family==="Portfolio / Work")).toHaveLength(3);
    expect(mediaStudies.filter(s=>s.family==="Gallery / Photography")).toHaveLength(5);
    expect(mediaStudies.filter(s=>s.family==="Lookbook / Campaign")).toHaveLength(3);
    expect(mediaStudies.filter(s=>s.family==="Mixed Media")).toHaveLength(2);
  });
  it("rejects incomplete media, excess counts, duplicate IDs and incomplete pairs instead of silently fabricating content",()=>{
    const s=mediaStudies[8], b=mediaBriefs[0];
    expect(validateStudyBrief(s,{...b,items:b.items.slice(0,3)})).toContain("Look / closer requires complete authored pairs.");
    expect(validateStudyBrief(s,{...b,items:[]})).not.toEqual([]);
    expect(validateStudyBrief(s,{...b,items:Array(14).fill(b.items[0])})).toContain("Media IDs must be unique.");
    expect(validateStudyBrief(s,{...b,items:b.items.map(i=>({...i,alt:"",width:0}))})).toHaveLength(4);
    const video={...b.items[0],kind:"video" as const};
    expect(validateStudyBrief(mediaStudies[10],{...b,items:[video,...b.items.slice(1)]})).not.toEqual([]);
    expect(validateStudyBrief(mediaStudies[0],briefForStudy("M11",b))).not.toEqual([]);
  });
  it("has playable local silent reels with explicit visual transcripts and no automatic playback",()=>{
    for(const b of mediaBriefs){
      const reel=briefForStudy("M11",b).items.at(-1)!;
      expect(reel.kind).toBe("video");expect(reel.transcript).toContain("No speech");
      const bytes=readFileSync(`public${reel.src}`);expect(bytes.subarray(4,8).toString()).toBe("ftyp");
      expect(statSync(`public${reel.src}`).size).toBeLessThan(2_000_000);
      const html=renderToStaticMarkup(createElement(MediaStudyArtwork,{study:mediaStudies[10],brief:briefForStudy("M11",b)}));
      expect(html).toContain('preload="none"');expect(html).toContain('controls=""');expect(html).not.toMatch(/autoplay|loop=/);
    }
  });
  it("preserves the authoritative Collection 004 review separately from lifecycle",()=>{
    expect(Object.values(collection004Review).filter(r=>r.status==="Approved")).toHaveLength(6);
    expect(collection004Review.S04.status).toBe("Promising / Revision Required");
    expect(collection004Review.S05.status).toBe("Rejected");
    expect(designComponents.filter(c=>"sourceConcept" in c && c.sourceConcept?.startsWith("S")).every(c=>c.status==="production")).toBe(true);
  });
});
