import "@/design-engine/preview/collection-008/collection.css";
import "@/design-engine/preview/hero-expansion/styles.css";
import type { Metadata } from "next";
import { ProfessionalLab } from "@/design-engine/preview/editor/ProfessionalLab";
import { labFontClasses } from "@/design-engine/preview/lab-fonts";
import "@/design-engine/styles.css";
import "@/design-engine/preview/collection-003b/collection.css";
import "@/design-engine/sections/storytelling/styles.css";
import "@/design-engine/preview/collection-004/collection.css";
import "@/design-engine/preview/collection-005/collection.css";
import "@/design-engine/preview/collection-006/collection.css";
import "@/design-engine/preview/collection-007/collection.css";
import "@/design-engine/composition/styles.css";
import "@/design-engine/preview/calibration/calibration.css";
import "@/design-engine/preview/composition/lab.css";
import "@/design-engine/preview/editor/editor.css";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
/** Existing admin layout enforces staff authorization. */
export default async function LabPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const { workspace } = await searchParams;
  return <div className={labFontClasses}><ProfessionalLab initialWorkspace={workspace === "composition" ? "composition" : "design"} /></div>;
}
