import { requireStaff } from "@/lib/vigil/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadProjectWorkspace } from "@/lib/vigil/professional/workspace";
import { ProfessionalProjectWorkspace } from "@/components/vigil/ProfessionalProjectWorkspace";
import { labFontClasses } from "@/design-engine/preview/lab-fonts";
import "@/design-engine/styles.css";
import "@/design-engine/composition/styles.css";
import "@/design-engine/sections/storytelling/styles.css";
import "@/design-engine/preview/composition/lab.css";
import "@/design-engine/preview/editor/editor.css";
import "@/design-engine/preview/calibration/calibration.css";

export const metadata = { title: "Professional project workspace", robots: { index: false, follow: false } };
export default async function ProfessionalProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireStaff();
  const { projectId } = await params;
  const data = await loadProjectWorkspace(await createClient(), projectId);
  return <div className={labFontClasses}><ProfessionalProjectWorkspace data={data}/></div>;
}
