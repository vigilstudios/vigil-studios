"use client";
import type { SectionInstance } from "../../composition/schemas";
import { transitionSection } from "../../composition/controls";

export type ClientDataDraft = { text: string; base: string; invalid: boolean; error?: string };
export function sectionClientData(section: SectionInstance) {
  return JSON.stringify({ content: section.content, ...("media" in section ? { media: section.media } : {}) }, null, 2);
}
/** Both editors write the canonical section; only incomplete JSON is kept separately. */
export function ClientDataEditor({ section, draft, onDraft, onChange }: {
  section: SectionInstance; draft?: ClientDataDraft; onDraft: (draft: ClientDataDraft | undefined) => void;
  onChange: (section: SectionInstance) => void;
}) {
  const canonical = sectionClientData(section);
  const text = draft && (draft.invalid || draft.base === canonical) ? draft.text : canonical;
  return <details className="composition-client-json"><summary>Advanced · Client Data JSON</summary>
    <p>Valid edits update the fields and preview automatically. Incomplete JSON stays here while the last valid content remains visible.</p>
    <label>Client Data JSON<textarea aria-label="Client Data JSON" rows={18} spellCheck={false} value={text} onChange={event => {
      const text = event.target.value;
      try {
        const patch: unknown = JSON.parse(text);
        if (!patch || typeof patch !== "object" || Array.isArray(patch) || Object.keys(patch).some(key => !["content", "media"].includes(key))) throw new Error("Only content and media belong in Client Data JSON.");
        const next = transitionSection(section, patch as Record<string, unknown>).section;
        onDraft({ text, base: sectionClientData(next), invalid: false });
        onChange(next);
      } catch (error) { onDraft({ text, base: canonical, invalid: true, error: error instanceof Error ? error.message : "Invalid client data." }); }
    }}/></label>
    {draft?.invalid && <p role="alert">{draft.error}{draft.base !== canonical ? " Fields changed while this JSON draft was incomplete. Restore current data to refresh it." : ""}</p>}
    <button type="button" onClick={() => onDraft(undefined)}>Restore current data</button>
  </details>;
}
