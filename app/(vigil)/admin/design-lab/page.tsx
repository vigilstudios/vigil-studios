import { redirect } from "next/navigation";

/** Preserve existing bookmarks in the unified staff Lab. */
export default function LegacyLabPage() { redirect("/admin/lab?workspace=design"); }
