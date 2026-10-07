import coast from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import night from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture-blue-hour.jpg";
import stone from "@/docs/design-engine/creative-calibration-002/assets/coastal-stone-detail.jpg";
import building from "@/docs/design-engine/creative-collection-001/assets/architecture-study.jpg";
import food1 from "@/docs/design-engine/creative-collection-005/assets/restaurant-1.webp";
import food2 from "@/docs/design-engine/creative-collection-005/assets/restaurant-2.webp";
import food3 from "@/docs/design-engine/creative-collection-005/assets/restaurant-3.webp";
import food4 from "@/docs/design-engine/creative-collection-005/assets/restaurant-4.webp";
import type { StaticImageData } from "next/image";
import { serviceStudySchemas, type ServiceContent, type ServiceStudyId } from "./contracts";
const photo=(asset:StaticImageData,alt:string)=>({src:typeof asset==="string"?asset:asset.src,width:asset.width||1200,height:asset.height||900,alt:`${alt}. Illustrative study image.`});
export const serviceContexts = [
 {id:"architecture",brand:"COMMON GROUND",context:"Architecture practice",title:"Better places begin with better questions.",introduction:"A small practice for the whole life of a place. We connect the first question to the last considered detail.",palette:["#f0eadf","#312b25","#735332"]},
 {id:"platform",brand:"RELAY / DATA",context:"Data infrastructure platform",title:"From raw events to useful signals.",introduction:"Understand the capabilities behind a dependable data pipeline. Explicit inputs, inspectable transformations and accountable delivery.",palette:["#12232b","#eef4ee","#a5d6bb"]},
 {id:"cooking",brand:"Gather school",context:"Community cooking school",title:"A little confidence. A whole new kitchen.",introduction:"Learn through making, tasting and sharing. Find a welcoming way into everyday cooking, whether you are starting out or opening a new chapter.",palette:["#f4dfb9","#3d3026","#803821"]},
] as const;
export type ServiceContext = typeof serviceContexts[number];
// These are fictional briefs. Each tuple describes an offering, an application and a scope boundary.
const offerings = {
 architecture:[
  ["Read the site","Understand the place before drawing the building.","Site walks","A brief grounded in the site","Survey, light and access studies","No land valuation"],
  ["Shape the space","Explore how daily life can inhabit a new plan.","Concept design","A clear spatial direction","Plan options and physical models","No planning guarantee"],
  ["Resolve the detail","Connect materials, assembly and the life of the room.","Technical design","Decisions ready for coordination","Material schedules and junction studies","Specialist engineering is separate"],
  ["Care for the build","Keep the intent visible as the work takes shape.","Site observation","A considered response to change","Site notes and design clarifications","No contractor supervision"],
  ["Adapt what exists","Find a new use without erasing the story of a place.","Adaptive reuse","An informed route to reuse","Fabric review and reuse options","Intrusive surveys are separate"],
  ["Plan the next chapter","Make a useful roadmap for future change.","Long-term planning","A sequence that can grow over time","Phasing studies and priorities","No funding advice"],
 ],
 platform:[
  ["Connect sources","Bring events from existing systems into a shared stream.","Ingestion","Sources enter through explicit contracts","Connectors and schema checks","Custom adapters need review"],
  ["Shape events","Transform raw records with visible, versioned logic.","Transformation","Reusable transformations with lineage","Mapping rules and version history","No opaque automatic cleanup"],
  ["Protect access","Assign responsibility for who can see and change data.","Governance","Access that follows ownership","Role policies and audit records","No compliance certification"],
  ["Observe delivery","Inspect what arrived, what changed and what needs attention.","Observability","A clear path to a delivery issue","Run history and failure context","Not an on-call response service"],
  ["Serve a signal","Publish governed outputs to the tools people use.","Delivery","A documented consumption contract","Exports and delivery endpoints","Downstream tools are separate"],
  ["Replay a run","Revisit a bounded interval when a source changes.","Recovery","Repeatable recovery steps","Replay windows and run comparisons","Retention depends on configuration"],
 ],
 cooking:[
  ["Start with supper","Build a few dependable meals before adding complexity.","Everyday classes","A meal you can make again","Knife practice and simple sauces","No professional qualification"],
  ["Follow the season","Let fresh produce set the direction for the table.","Seasonal workshops","More ways to use what is available","Market notes and flexible recipes","Ingredients change with the season"],
  ["Cook together","Share the work of a meal with people you want to know.","Group sessions","A table everyone helped create","Shared preparation and hosting","Not a catering service"],
  ["Make it your own","Adapt a familiar technique to taste and circumstance.","Skills clinics","Confidence to adjust a recipe","Tasting practice and substitutions","Not dietary or medical advice"],
  ["Waste a little less","Turn overlooked ingredients into useful next meals.","Kitchen habits","Practical ways to use more of each ingredient","Storage habits and leftovers","No certified food-safety training"],
  ["Pass it on","Learn to guide a small group through a shared recipe.","Community programs","A plan for teaching together","Facilitation notes and practice","No teaching accreditation"],
 ],
} as const;
const images = {
 architecture:[photo(coast,"A coastal home in daylight"),photo(building,"An architectural study of built space"),photo(stone,"A limestone construction detail"),photo(night,"The coastal home in evening light")],
 platform:["ingest","transform","govern","deliver"].map((id)=>({src:`/design-engine-study-006/${id}.svg`,width:960,height:680,alt:`Illustrative ${id} capability diagram, with labelled inputs and outputs. Not a product screenshot.`})),
 cooking:[photo(food1,"A breakfast table arranged for a shared meal"),photo(food2,"A prepared mushroom pasta dish"),photo(food4,"A dining space for shared meals"),photo(food3,"Coffee and croissants on a breakfast table")],
};
const journey = {
 architecture:[ ["Listen","Your ambitions and site","Map needs, constraints and competing priorities.","An agreed brief","Client + architect"],["Explore","The agreed brief","Test spatial options and discuss the tradeoffs.","A preferred direction","Architect"],["Coordinate","The selected direction","Resolve materials and technical interfaces.","Coordinated information","Architect + specialists"],["Observe","The coordinated information","Review the developing work against design intent.","A record of decisions","Architect + client"] ],
 platform:[ ["Receive","Source events","Validate the envelope against a versioned contract.","Accepted records","Source owner"],["Transform","Accepted records","Apply the declared mapping and retain lineage.","Versioned datasets","Pipeline owner"],["Authorize","Versioned datasets","Apply access rules before publication.","Governed outputs","Data steward"],["Deliver","Governed outputs","Publish to a named destination with delivery context.","A traceable delivery record","Consumer owner"] ],
 cooking:[ ["Choose","Your experience and interests","Pick a session that starts from what you know.","A practical starting point","Learner + host"],["Prepare","Your starting point","Read the recipe and handle the ingredients together.","A ready workspace","Learner"],["Make","A ready workspace","Try the technique, taste and adjust with guidance.","A shared meal","Learner + tutor"],["Continue","Your shared meal","Take a flexible recipe into your own kitchen.","A plan for next time","Learner"] ],
};
const scopes = {
 architecture:{names:["Early direction","Design development","Continuing practice"],fit:["A site and an open question","A direction ready to resolve","A place that changes over time"],criteria:["Starting material","Primary output","Working rhythm","Specialists","After the handoff"],values:[["Site + ambitions","Feasibility brief","Two workshops","Identify needs","Written next steps"],["Agreed brief","Coordinated design","Design reviews","Coordinate inputs","Design clarifications"],["An existing place","Phased roadmap","Periodic review","As needed","Ongoing record"]]},
 platform:{names:["Explore","Operate","Govern"],fit:["A bounded dataset to understand","A pipeline with named owners","Multiple teams sharing outputs"],criteria:["Input contract","Transformation","Access model","Delivery context","Recovery process"],values:[["Sample source","Draft mapping","Workspace roles","Preview records","Repeat sample"],["Versioned source","Published mapping","Pipeline roles","Run history","Bounded replay"],["Shared catalog","Reviewed mapping","Steward policies","Audit context","Reviewed recovery"]]},
 cooking:{names:["First supper","Seasonal practice","Shared table"],fit:["A first step in the kitchen","A habit you want to develop","A group who wants to cook together"],criteria:["Starting experience","Format","What you make","Support","Take-home material"],values:[["None required","One guided session","A simple meal","Tutor demonstration","Flexible recipe"],["Some home cooking","Workshop series","Seasonal dishes","Practice feedback","Seasonal notebook"],["Mixed experience","Group session","A shared menu","Group facilitation","Hosting notes"]]},
};
const promises={architecture:["Make room for a considered life.","Listen","Shape","Care"],platform:["Make every handoff inspectable.","Connect","Explain","Protect"],cooking:["Good food begins with confidence.","Try","Taste","Share"]};
const problems={architecture:["The site is full of possibility, but the starting point is unclear.","A plan works on paper, but daily life needs more care.","The details risk losing the original intention."],platform:["Records arrive from sources that do not agree.","A changed mapping is hard to trace downstream.","Access rules drift as more teams join."],cooking:["You want to cook, but a recipe feels like a test.","Seasonal ingredients arrive without a clear plan.","Cooking for a group feels like doing everything alone."]};
const base=(b:ServiceContext)=>({brand:b.brand,title:b.title,introduction:b.introduction});
export function serviceFixture(id:ServiceStudyId, b:ServiceContext):ServiceContent {
 const rows=offerings[b.id], pictures=images[b.id];
 const link=(i:number)=>({label:`Explore ${rows[i][2].toLowerCase()}`,href:`#${id.toLowerCase()}-${b.id}-detail-${i}`});
 const common=base(b);
 // Separate payloads intentionally retain the relationship each mechanism needs.
 let content:unknown;
 switch(id){
 case "C01": content={...common,entries:rows.slice(0,b.id==="platform"?6:4).map((r,i)=>({id:`entry-${i}`,title:r[0],summary:r[1],deliverables:[r[2],r[4]],detail:link(i)}))};break;
 case "C02": content={...common,promise:promises[b.id][0],principles:rows.slice(0,3).map((r,i)=>({verb:promises[b.id][i+1],pledge:r[1],boundary:r[5]}))};break;
 case "C03": content={...common,capabilities:rows.slice(0,b.id==="platform"?6:4).map((r,i)=>({id:`capability-${i}`,title:r[2],category:b.id==="platform"?`Layer ${i+1}`:i<2?"Begin":"Develop",description:r[1],outcome:r[3],image:pictures[i%4],detail:link(i)}))};break;
 case "C04": content={...common,services:rows.slice(0,b.id==="cooking"?5:6).map((r,i)=>({id:`service-${i}`,title:r[2],summary:r[1],included:[r[3],r[4]],boundary:r[5],detail:link(i)}))};break;
 case "C05": content={...common,situations:rows.slice(0,3).map((r,i)=>({need:problems[b.id][i],response:`${r[2]} — ${r[1]}`,outcome:r[3],evidence:`Illustrative deliverable: ${r[4].toLowerCase()}. Outcomes depend on the brief.`}))};break;
 case "C06": content={...common,stages:journey[b.id].map((s,i)=>({id:`stage-${i}`,title:s[0],input:s[1],work:s[2],output:s[3],owner:s[4]}))};break;
 case "C07": content={...common,phases:journey[b.id].map(s=>s[0]),groups:[0,1,2].map((g)=>({name:b.id==="platform"?["Sources & shaping","Trust & operation","Delivery & continuity"][g]:b.id==="architecture"?["Place & intention","Detail & making","Adaptation & care"][g]:["Everyday practice","People & confidence","Habits & community"][g],capabilities:rows.slice(g*2,g*2+2).flatMap((r,i)=>[{id:`cap-${g}-${i}`,title:r[2],coverage:journey[b.id].map((_,p)=>p===(g+i)%4?"Lead":p===(g+i+1)%4?"Support":"—")},...(b.id==="platform"?[{id:`cap-extra-${g}-${i}`,title:r[4],coverage:journey[b.id].map((_,p)=>p===(g+i+1)%4?"Lead":"Support")}]:[])] )}))};break;
 case "C08": content={...common,input:journey[b.id][0][1],output:journey[b.id][3][3],layers:journey[b.id].map((s,i)=>({id:`layer-${i}`,title:s[0],responsibility:s[2],components:[rows[b.id==="platform"&&i===3?4:i][2],rows[b.id==="platform"&&i===3?4:i][4]],handoff:journey[b.id][i+1]?.[1] ?? s[3]}))};break;
 case "C09": content={...common,plates:rows.slice(0,4).map((r,i)=>({id:`plate-${i}`,title:r[2],image:pictures[i],caption:`${r[0]}. ${r[1]}`,application:`Application: ${r[4].toLowerCase()}.`,detail:link(i)}))};break;
 case "C10": content={...common,cases:rows.slice(0,b.id==="platform"?3:2).map((r,i)=>({id:`case-${i}`,title:r[2],before:{image:pictures[i],label:b.id==="platform"?"Input context":"The starting observation",note:r[1]},after:{image:pictures[(i+2)%4],label:b.id==="platform"?"Related output context":"A related application",note:r[4]},capability:r[0],evidence:"Illustrative relationship, not a measured before-and-after result. These plates explain the capability; they do not document a completed client engagement."}))};break;
 case "C11": content={...common,question:b.id==="architecture"?"Where is your project today?":b.id==="platform"?"What needs to become clearer?":"What would help you begin?",paths:rows.slice(0,3).map((r,i)=>({id:`path-${i}`,title:r[0],need:problems[b.id][i],recommendation:r[2],reason:r[1],alternative:`If this is not your starting point, explore ${rows[(i+1)%3][2].toLowerCase()}.`,detail:link(i)}))};break;
 case "C12": {const s=scopes[b.id];content={...common,criteria:s.criteria,offerings:s.names.map((name,i)=>({id:`scope-${i}`,title:name,bestFor:s.fit[i],values:s.values[i],boundary:rows[i][5],detail:{label:`Explore ${name.toLowerCase()}`,href:`#c12-${b.id}-detail-${i}`}}))};break;}
 }
 return {kind:id,content:serviceStudySchemas[id].parse(content)} as ServiceContent;
}
