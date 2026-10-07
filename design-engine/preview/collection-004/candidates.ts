import { parseSection, type SectionInstance } from "../../composition/schemas";
import { storyAdaptations } from "./fixtures";
export type StoryCandidateId = "story.object-biography" | "story.working-conversation" | "story.decision-ledger";
export const adaptationIds = ["workshop", "community", "research"] as const;
export type ContentLength = "standard" | "short" | "long";
/** Client data is kept at the preview boundary, separate from reusable source. */
export function makeStorySection<K extends StoryCandidateId>(component: K, id: string, adaptation = "workshop", length: ContentLength = "standard"): SectionInstance<K> {
  const index = adaptationIds.indexOf(adaptation as typeof adaptationIds[number]);
  if (index < 0) throw new Error(`Unknown story adaptation: ${adaptation}`);
  const a = storyAdaptations[index];
  const long = (text: string, limit: number) => `${text} ${"A longer account gives the reader room to understand the context and the choices behind this work. ".repeat(8)}`.slice(0, limit).trim();
  const title = length === "short" ? a.client : length === "long" ? long(a.title, 178) : a.title;
  const introduction = length === "short" ? "A continuing practice." : length === "long" ? long(a.deck, 590) : a.deck;
  const base = { id, component, motion: "none", content: { title, introduction } };
  if (component === "story.object-biography") return parseSection({ ...base, content: { ...base.content, subject: a.subject, origin: a.origin, continuation: a.continuation, records: a.records.map(r => ({ ...r, body: length === "long" ? long(r.body, 590) : length === "short" ? r.body.split(".")[0] + "." : r.body })) }, media: { image: { ...a.object, caption: "Generated concept image; replace with client-owned media and attribution." } }, treatment: { geometry: "contained", tone: "natural" }, structure: "annotated" }) as SectionInstance<K>;
  if (component === "story.working-conversation") return parseSection({ ...base, content: { ...base.content, attribution: "Invented dialogue for an imagined brief. Client publication requires approved, attributed words.", exchanges: a.exchanges.map(e => ({ ...e, answer: length === "long" ? long(e.answer, 890) : length === "short" ? e.answer.split(".")[0] + "." : e.answer })) }, structure: "transcript" }) as SectionInstance<K>;
  return parseSection({ ...base, content: { ...base.content, columns: ["Principle", "The tension", "In practice"], rationaleLabel: "Why this choice", decisions: a.decisions.map(d => ({ ...d, rationale: length === "long" ? long(d.rationale, 690) : length === "short" ? d.rationale.split(".")[0] + "." : d.rationale })) }, structure: "open" }) as SectionInstance<K>;
}
