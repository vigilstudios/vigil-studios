import { parseSection, type SectionInstance } from "../composition/schemas";
import type { EndingSectionId, EndingForm } from "../composition/ending-schemas";
import { makeCollectionSection } from "./production-fixtures";
export function inquiryPreset(kind:"general"|"collaboration"|"booking"|"newsletter"):EndingForm {
  const email={id:"email",label:"Email",type:"email" as const,required:true,autocomplete:"email" as const};
  const name={id:"name",label:"Your name",type:"text" as const,required:true,autocomplete:"name" as const};
  return {
    title:kind==="newsletter"?"Studio notes":kind==="collaboration"?"Start a collaboration":kind==="booking"?"Request a booking":"Tell us about your project",
    description:kind==="newsletter"?"Occasional updates, new work and useful ideas.":"Share a little context so we can direct your inquiry.",
    submitLabel:kind==="newsletter"?"Subscribe":"Send inquiry",successMessage:kind==="newsletter"?"You are subscribed.":"Your inquiry was received.",
    unavailableMessage:kind==="newsletter"?"Newsletter sign-up is not connected yet.":"Online inquiries are not connected yet. Please use the contact options.",
    submission:{mode:"unavailable"},
    fields:kind==="newsletter"?[email]:[name,email,
      ...(kind==="collaboration"?[{id:"company",label:"Brand or organization",type:"text" as const,required:true,autocomplete:"organization" as const},{id:"inquiry",label:"Inquiry type",type:"select" as const,required:true,options:["Brand collaboration","Sponsorship","General inquiry"]},{id:"budget",label:"Budget range (optional)",type:"select" as const,required:false,options:["To discuss","Under $5,000","$5,000–$15,000","$15,000+"]}]:[]),
      ...(kind==="booking"?[{id:"phone",label:"Phone (optional)",type:"tel" as const,required:false,autocomplete:"tel" as const},{id:"inquiry",label:"Booking interest",type:"select" as const,required:true,options:["Speaking","Appearance","Project consultation"]},{id:"date",label:"Preferred date",type:"date" as const,required:false},{id:"time",label:"Preferred time",type:"select" as const,required:false,options:["Morning","Afternoon","Evening"]}]:[]),
      {id:"message",label:"Project or inquiry details",type:"textarea" as const,required:true},
      {id:"consent",label:"I agree to be contacted about this inquiry.",type:"checkbox" as const,required:true},
    ],
  };
}
export function makeEndingSection<K extends EndingSectionId>(component:K,id:string,config:Readonly<Record<string,string>>={}):SectionInstance<K> {
  const context=config.adaptation??"architecture";
  const gallery=makeCollectionSection("work.gallery-hanging",id,context==="creator"?"apparel":context,config.contentLength??"standard");
  if(gallery.component!=="work.gallery-hanging")throw new Error("Gallery fixture required");
  const long=config.contentLength==="long";
  const brand=context==="creator"?"Avery Studio":context==="hospitality"?"Common Ground":"Field Practice";
  const voice=context==="creator"?{title:"Bring your next collaboration into focus.",intro:"For campaigns, sponsorships and creative partnerships, share your brand, audience and ambition."}:context==="hospitality"?{title:"Make your next gathering feel like you.",intro:"Tell us about the occasion, the people and the experience you want to create."}:{title:"Let’s make something worth sharing.",intro:"Bring your idea, your ambition and your questions. We’ll find the next step together."};
  const content={title:long?"Make room for the next chapter of your work, with a thoughtful creative partner at every step.":voice.title,introduction:long?voice.intro+" Tell us what you are imagining, who it is for and what a good outcome looks like. We will help define a useful next step, with room for your goals, practical constraints and the details that make the work yours.":voice.intro,eyebrow:"Your next chapter"};
  const socials=[{id:"instagram",title:"Instagram",destination:{type:"external",url:"https://www.instagram.com/"}},{id:"youtube",title:"YouTube",destination:{type:"external",url:"https://www.youtube.com/"}}];
  const footerContent={brand,statement:content.introduction,copyright:`© {year} ${brand}. All rights reserved.`,navigationLabel:"Explore the site",groups:[{id:"explore",title:"Explore",links:[{id:"work",title:"Selected work",destination:{type:"external",url:"https://example.com/work"}},{id:"about",title:"Our practice",destination:{type:"external",url:"https://example.com/about"}}]},{id:"connect",title:"Connect",links:[{id:"email",title:"Email us",destination:{type:"email",email:"hello@example.com"}}]}],socials,legal:[]};
  const common={id,component,motion:"none",density:"open",surface:"transparent",measure:"wide"};
  const payload=component==="cta.editorial"?{...common,content,structure:"center"}
    :component==="cta.signal"?{...common,content:{...content,image:gallery.content.works[0].image},structure:"poster",surface:"brand",height:"section"}
    :component==="contact.inquiry"?{...common,content:{...content,title:"A good conversation starts here.",details:[{id:"inquiries",title:"General inquiries",destination:{type:"email",email:"hello@example.com"}},{id:"management",title:"Management & partnerships",destination:{type:"email",email:"management@example.com"}}],socials,location:"Working together, wherever you are.",hours:"Monday–Friday · by appointment",form:inquiryPreset("collaboration")},structure:"split"}
    :component.startsWith("footer.")?{...common,content:{...footerContent,...(["footer.split","footer.banner"].includes(component)?{title:content.title,newsletter:inquiryPreset("newsletter")}:{})},structure:component==="footer.compact"?"center":component==="footer.banner"?"center":"brand-left",navigationDepth:component==="footer.compact"?"top-level":"two-level"}
    :component==="work.expand-rail"?{id,component,content:{...content,title:"Selected work",works:gallery.content.works},surface:"transparent",density:"open",structure:"label-rails",motion:"depth-shift",height:"portrait",railWidth:"compact"}
    :component==="work.card-rail"?{id,component,content:{...content,title:"Explore the collection",works:gallery.content.works},surface:"transparent",density:"open",structure:"cards",motion:"depth-shift",ratio:"portrait",filter:"category",inspection:"dialog"}
    :{id,component,content:{...content,title:"A closer look",works:gallery.content.works},surface:"transparent",density:"open",structure:"portrait",motion:"depth-shift",lens:"strong"};
  const choices=Object.fromEntries(Object.entries(config).filter(([key])=>key in payload&&!["id","component","content"].includes(key)));
  return parseSection({...payload,...choices}) as unknown as SectionInstance<K>;
}
