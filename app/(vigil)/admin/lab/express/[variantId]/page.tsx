import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseExpressDraft } from "@/lib/vigil/express/document";
import { ExpressVariantWorkspace } from "@/components/vigil/ExpressVariantWorkspace";
import { labFontClasses } from "@/design-engine/preview/lab-fonts";
import "@/design-engine/styles.css";
import "@/design-engine/composition/styles.css";
import "@/design-engine/sections/storytelling/styles.css";
import "@/design-engine/preview/composition/lab.css";
import "@/design-engine/preview/editor/editor.css";
import "@/design-engine/preview/calibration/calibration.css";
export const metadata={title:"Express variant editor",robots:{index:false,follow:false}};
export default async function VariantPage({params}:{params:Promise<{variantId:string}>}) {
 await requireStaff(); const {variantId}=await params;
 const {data,error}=await(await createClient()).from("express_variants").select("id,slug,draft,revision,published_revision,archived_at").eq("id",variantId).is("archived_at",null).maybeSingle();
 if(error)throw error;if(!data)notFound();
 return <div className={labFontClasses}><ExpressVariantWorkspace variant={{...data,draft:parseExpressDraft(data.draft,data.id)}}/></div>;
}
