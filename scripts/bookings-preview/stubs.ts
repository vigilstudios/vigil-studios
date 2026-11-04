import { parseBrief } from "@/lib/vigil/onboarding/brief";
export async function getBookings(_website?:string,view="upcoming",page=1){
 const website="ba000000-0000-4000-8000-000000000021",org="ba000000-0000-4000-8000-000000000011",resource="ba000000-0000-4000-8000-000000000031",service="ba000000-0000-4000-8000-000000000041",id="ba000000-0000-4000-8000-000000000051",now="2030-11-04T15:00:00Z";
 return {asOf:Date.parse("2030-11-03T15:00:00Z"),enabled:true as const,ctx:{role:"owner",staffRole:null},site:{id:website,name:"Marlow Studio"},sites:[{id:website,name:"Marlow Studio"}],eligible:true,page,count:1,
 settings:{enabled:false,component_ready:false,time_zone:"America/New_York",minimum_notice:60,horizon_days:90,change_notice:120},
 bookingNeeds:parseBrief({basics:{businessName:"Marlow Studio",booking:{approach:"vigil",mode:"both",services:"Consultations and project reviews"}}}).basics?.booking,
 resources:[{id:resource,name:"Jordan · Studio",active:true,hours:[1,2,3,4,5].map(day=>({day,start:"09:00",end:"17:00"}))}],
 services:[{id:service,resource_id:resource,name:"Initial consultation",description:"Plan your next project with our team.",duration:30,buffer_before:15,buffer_after:15,mode:"approval",active:true}],blocks:[],
 appointments:[{id,website_id:website,organization_id:org,service_id:service,resource_id:resource,lead_id:"ba000000-0000-4000-8000-000000000061",service_name:"Initial consultation",time_zone:"America/New_York",confirmation_mode:"approval",status:view==="requests"?"requested":"confirmed",starts_at:now,ends_at:"2030-11-04T15:30:00Z",reserved_from:"2030-11-04T14:45:00Z",reserved_until:"2030-11-04T15:45:00Z",duration:30,buffer_before:15,buffer_after:15,requested_start_at:null,request_expires_at:view==="requests"?"2030-11-04T14:00:00Z":null,contact:{name:"Avery Parker",email:"avery@example.test"},notes:"I’d like to discuss a new project.",revision:1,created_at:now,updated_at:now}],events:[{id:1,appointment_id:id,kind:view==="requests"?"requested":"confirmed",created_at:"2030-11-03T15:00:00Z"}]};
}
const preview=async()=>({ok:false as const,error:"Preview only. No changes were saved."});
export const saveBookingResource=()=>preview(),saveBookingService=()=>preview(),saveBookingSettings=()=>preview(),changeBooking=()=>preview(),blockBookingDays=()=>preview(),removeBookingBlock=()=>preview();
