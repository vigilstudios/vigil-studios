/** Tiny runtime publication guard; schema validation remains at the data boundary. */
export function evidencePublicationIssues(value: unknown): string[] {
 const issues: string[] = [];
 const walk = (v: unknown, path: string) => {
  if (!v || typeof v !== "object") return;
  if ("status" in v && v.status === "demo") issues.push(`${path}: illustrative evidence cannot be published`);
  Object.entries(v).forEach(([k,item]) => walk(item, `${path}.${k}`));
 };
 walk(value, "evidence"); return issues;
}
