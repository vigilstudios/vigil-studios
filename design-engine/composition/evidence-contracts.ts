import { getActionCapabilities } from "../actions/capabilities";
import type { SectionContract } from "./contracts";
import type { EvidenceSectionId } from "./evidence-schemas";
import { chorusConfiguration } from "./evidence-schemas";
import { evidenceDescriptors } from "./evidence-descriptors";
export { evidenceDescriptors } from "./evidence-descriptors";
export const evidenceSectionIds = ["proof.margin-voice","proof.outcome-equation","proof.change-dossier","proof.case-cross-section","proof.credential-library","proof.moving-chorus","proof.review-reading-room","proof.in-conversation","proof.relationship-register","proof.progress-trail","proof.evidence-desk","proof.story-switchboard"] as const;
const ranges = [[1,1],[1,1],[3,3],[1,1],[3,12],[3,24],[3,30],[2,6],[4,18],[3,6],[2,5],[2,6]] as const;
const behaviors = ["media-reveal","fade","media-reveal","media-reveal","fade","marquee","none","media-reveal","fade","stagger","media-reveal","fade"] as const;
export const evidenceContracts = Object.fromEntries(evidenceSectionIds.map((id,index)=>{
 const d=evidenceDescriptors[index], behavior=behaviors[index];
 return [id, { actions:getActionCapabilities(id),
 category:"proof",usage:d.usage, structuralDNA:`${d.id}: ${d.dna}${index===5?" Supports horizontal ribbon, independently measured opposing vertical columns and a perspective field; every voice retains its canonical source reading.":""}`,contentSchema:id,mediaSchema:[1,6,9].includes(index)?null:`${id}.evidence-media`,
 evidence:{model:d.family,scale:index===5?"moderate":ranges[index][1]===1?"single":ranges[index][1]>=12?"large":"small",idealRange:index===5?{min:4,max:9}:undefined,integrity:"publication-source-required; explicit illustrative Lab mode; host owns permission and verification declarations"},
 contentConstraints:`${d.content}. Stable unique record IDs, strict bounds and source/timeframe/context required. E06 accepts 3–24 distinct voices; ideal 4–9, 1000 characters maximum per quote. No external totals or invented aggregate claims.`,
 mediaRequirements:`${d.media} Optional media uses intrinsic dimensions, alt, mobile sources/focal points, lazy delivery and authored captions. Speech video requires captions/transcript, preload none and user controls.`,
 itemRange:{min:ranges[index][0],max:ranges[index][1],unit:["voice","measured comparison","transformation stages","case","recognitions","distinct voices","supplied reviews","interview exchanges","relationships","observations","exhibits","cases"][index]},
 variants:["authored"],configuration:index===5?chorusConfiguration:[],
 typography:{profiles:["editorial","luxury","neo-grotesk","geometric","poster","humanist","technical","brutalist","playful","fashion"],roles:["display","heading","body","accent","mono"],behavior:"Independent semantic font roles; quotes/metrics cap scale and wrap without changing narrative relationships. E06 scales consume body, heading or display profile roles."},
 artDirections:index===5?["gallery","publication","precision","billboard","salon","runway"]:[...new Set(d.art)],artBehavior:"Section spacing, gutters, gaps, rules and media framing consume art tokens; chronology, equations, voice hierarchy and loop remain structural.",
 motion:behavior === "none"?["none"]:["none",behavior], motionIntensities:behavior === "none"?["none"]:["none","restrained","expressive"],overrides:behavior === "none"?["typography","artDirection"]:["typography","artDirection","motion"],
 media:[1,6,9].includes(index)?null:{geometries:["contained"],tones:["natural"]},icons:["arrow-up-right"],
 interactionCapabilities:index===5?["continuous-visual-loop","vertical-columns","perspective-field","explicit-pause","hover-pause","focus-pause","canonical-source-reading-wall"]:index===11?["visitor-started-sequence","selection","stop-on-focus","all-record-reading"]:index===4||index===6?["record-selection","source-disclosure","polite-announcement"]:["semantic-reading","source-disclosure","native-destinations"],
 compatibility:{flow:{surface:"inherited",bleed:index===5?"full":"inset",scrolling:"document",sticky:false,density:[6,8,10].includes(index)?"dense":"open"}},
 responsive:{desktop:d.dna,tablet:"Bound gutters, quotes and metrics; preserve caption ownership and ordered relationships.",mobile:index===5?"Continuous loop retained with 75–85% width voices, fewer concurrent surfaces and 65% travel rate. Reading wall becomes one column.":d.mobile,readingOrder:["heading","evidence","attribution","measurement context","source","optional host destination"]},
 accessibility:{landmark:"section",heading:"h2",keyboard:index===5?"Visual loop is inert and aria-hidden. Canonical full quotes/links stay in a native reading disclosure; focus pauses movement. Explicit persistent Pause/Resume; opening reading wall pauses. Native links retain focus.":d.interaction,reducedMotion:index===5?"OS reduce or site none unmounts visual copies/observers and opens full static reading wall. No forced movement.":index===11?"Manual selection; no timed sequencing under OS reduce/site none.":"Complete resting evidence; no count-from-zero or essential information hidden.",contrast:"Semantic foreground/background and opaque surfaces; graphic comparison has visible text labels. Client palettes require contrast review."}
 } satisfies SectionContract];
})) as unknown as Record<EvidenceSectionId,SectionContract>;
