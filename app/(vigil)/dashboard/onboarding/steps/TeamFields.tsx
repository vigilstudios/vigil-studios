"use client";
import { Plus, Trash2, Users } from "lucide-react";
import type { Brand } from "@/lib/vigil/onboarding/brief";
import type { SignedAsset } from "@/lib/vigil/queries/onboarding";
import { OnboardingSection, Field, TextArea, TextInput, Toggle } from "../wizard-ui";
import { OfferingImages } from "./OfferingImages";

type Props = { value: Brand["team"]; onChange: (team: Brand["team"]) => void; projectId: string; organizationId: string; assets: SignedAsset[]; onAssets: (assets: SignedAsset[]) => void; disabled: boolean; onBusy: (busy: boolean) => void };
export function TeamFields({ value, onChange, ...media }: Props) {
  const add = () => onChange({ ...value, members: [...value.members, { id: crypto.randomUUID(), name: "", role: "", bio: "", imageAssetIds: [] }] });
  const update = (id: string, patch: Partial<Brand["team"]["members"][number]>) => onChange({ ...value, members: value.members.map(member => member.id === id ? { ...member, ...patch } : member) });
  return <OnboardingSection icon={Users} title="The team" description="Introduce the people behind your business. Add only details and photos you want shown publicly on your website." optional>
    <Toggle id="showTeam" checked={value.enabled} onChange={enabled => onChange({ ...value, enabled })} label="Showcase my team" />
    {value.enabled && <>
      <p className="text-[13px] leading-5 text-[color:var(--text-secondary)]">Your team will have its own Content Hub tab for updates after launch with Care or higher. Photos are kept in Files.</p>
      {value.members.map((member, index) => <fieldset aria-label={`Team member ${index + 1}`} key={member.id} disabled={media.disabled} className="min-w-0 space-y-3 rounded-xl border border-[color:var(--border)] p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Team member {index + 1}</span><button type="button" aria-label={`Remove team member ${index + 1}`} onClick={() => onChange({ ...value, members: value.members.filter(m => m.id !== member.id) })} className="flex h-10 w-10 items-center justify-center rounded-md text-[color:var(--text-secondary)] hover:text-[color:var(--status-bad)]"><Trash2 size={16} /></button></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field id={`team-name-${member.id}`} label="Name"><TextInput id={`team-name-${member.id}`} placeholder="Full name" value={member.name} onChange={e => update(member.id, { name: e.target.value })} maxLength={160} /></Field><Field id={`team-role-${member.id}`} label="Role" optional><TextInput id={`team-role-${member.id}`} placeholder="e.g. Founder or Creative Director" value={member.role} onChange={e => update(member.id, { role: e.target.value })} maxLength={160} /></Field></div>
        <Field id={`team-bio-${member.id}`} label="Short bio" optional><TextArea id={`team-bio-${member.id}`} rows={3} placeholder="A little about their experience, personality or work." value={member.bio} maxLength={2000} onChange={e => update(member.id, { bio: e.target.value })} /></Field>
        <OfferingImages {...media} itemName={member.name || `team member ${index + 1}`} ids={member.imageAssetIds} onChange={imageAssetIds => update(member.id, { imageAssetIds })} maxImages={1} />
      </fieldset>)}
      <button type="button" disabled={media.disabled || value.members.length >= 50} onClick={add} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-dashed border-[color:var(--border)] px-3 text-xs disabled:opacity-50"><Plus size={14} />Add team member</button>
    </>}
  </OnboardingSection>;
}
