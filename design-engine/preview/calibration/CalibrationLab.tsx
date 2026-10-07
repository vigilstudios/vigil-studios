"use client";
import { useState, type ReactNode } from "react";
import { PreviewCanvas } from "../PreviewCanvas";
import { CapabilityControl } from "../CapabilityControl";
import { LabEditor } from "../editor/LabEditor";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import { typographyProfiles, type TypographyProfileId } from "../../foundations/typography/profiles";
import { artDirections, type ArtDirectionId, type MotionDirection } from "../../foundations/art-direction";
import { designThemes, type DesignThemeId } from "../../foundations/themes";
import { RetestStudy, retestStudies, type RetestId } from "./RetestStudy";
export function CalibrationLab({ toolbar, workspaceSwitch }: { toolbar?: ReactNode; workspaceSwitch?: ReactNode }) {
  const [structure, setStructure] = useState<RetestId>("H09");
  const [typography, setTypography] = useState<TypographyProfileId>("luxury");
  const [art, setArt] = useState<ArtDirectionId>("gallery");
  const [motion, setMotion] = useState<MotionDirection>("none");
  const [theme, setTheme] = useState<DesignThemeId>("neutral");
  const [device, setDevice] = useState("desktop");
  const [compare, setCompare] = useState(false);
  const [replay, setReplay] = useState(0);
  const [tab, setTab] = useState("study");
  const [audition, setAudition] = useState<{ structure?:RetestId; typography?:TypographyProfileId; art?:ArtDirectionId; motion?:MotionDirection; theme?:DesignThemeId; device?:string } | null>(null);
  const preview = <K extends keyof NonNullable<typeof audition>>(key:K,value:string|null) => setAudition(value===null?null:{[key]:value});
  const shownDevice = audition?.device ?? device;
  const selected = retestStudies.find(s => s.id === structure)!;
  const render = (type: TypographyProfileId, direction: ArtDirectionId, temporary = false) => <DesignThemeProvider theme={temporary ? (audition?.theme ?? theme) : theme} typography={type} artDirection={direction} motion={temporary ? (audition?.motion ?? motion) : motion}><RetestStudy key={`${structure}-${replay}-${motion}`} id={temporary ? (audition?.structure ?? structure) : structure} /></DesignThemeProvider>;
  return <LabEditor title="Design Lab" workspaceSwitch={workspaceSwitch} canvasWidth={shownDevice === "mobile" ? 390 : shownDevice === "tablet" ? 768 : 1440} resetKey={structure} activeTab={tab} onTabChange={value=>{setAudition(null);setTab(value);}} toolbar={toolbar}
    tabs={[
      { id: "study", label: "Study", content: <><header className="calibration-intro"><h2>Same structure. Different creative direction.</h2><p>Calibration studies only. Original approvals are preserved in Figma. These are not registered components.</p></header><div className="calibration-controls">
      <CapabilityControl label="Component Structure" value={structure} choices={retestStudies.map(s=>({value:s.id,label:`${s.id} · ${s.name}`}))} onPreview={value=>setAudition(value===null?null:{structure:value as RetestId,motion:"none"})} onChange={value=>{setStructure(value as RetestId);setMotion("none");}} />
      <CapabilityControl label="Typography Profile" value={typography} choices={typographyProfiles.map(p=>({value:p.id,label:p.name}))} onPreview={value=>preview("typography",value)} onChange={value=>setTypography(value as TypographyProfileId)} />
      <CapabilityControl label="Art Direction" value={art} choices={artDirections.map(p=>({value:p.id,label:p.name}))} onPreview={value=>preview("art",value)} onChange={value=>setArt(value as ArtDirectionId)} />
      <CapabilityControl label="Motion" value={motion} choices={selected.motionCapability.values.map(value => ({ value }))} note={selected.motionCapability.reason} onPreview={value=>preview("motion",value)} onChange={value => setMotion(value as MotionDirection)} />
      <CapabilityControl label="Theme / Brand Tokens" value={theme} choices={designThemes.map(p=>({value:p.id,label:p.name}))} onPreview={value=>preview("theme",value)} onChange={value=>setTheme(value as DesignThemeId)} />
      <CapabilityControl label="Viewport" value={device} choices={[{value:"desktop",label:"Desktop"},{value:"tablet",label:"Tablet · 768px"},{value:"mobile",label:"Mobile · 390px"}]} onPreview={value=>preview("device",value)} onChange={setDevice} />
      {selected.motionCapability.values.length > 1 ? <button type="button" onClick={()=>setReplay(replay+1)}>Replay motion</button> : null}
      <button type="button" aria-pressed={compare} onClick={()=>setCompare(!compare)}>Compare Editorial / Poster</button>
    </div>
    <p className="calibration-note">{selected.feedback}</p>
    <p className="calibration-note">{typographyProfiles.find(p=>p.id===typography)?.description} {artDirections.find(p=>p.id===art)?.description}</p>
</> },
      { id: "notes", label: "Notes", content: <details className="calibration-details"><summary>Profile contract and review notes</summary><p>H09, H10, H12 and H16 remain approved concepts. H13 is a revision study. Font changes do not rescue H08, H11 or H15. H14 should be considered as a later page section.</p><pre>{JSON.stringify({ typography: typographyProfiles.find(p=>p.id===typography), artDirection: artDirections.find(p=>p.id===art), motion },null,2)}</pre></details> },
    ]}>
    <div className="calibration-frame"><PreviewCanvas authored={render(typography, art)} audition={audition ? render(audition.typography ?? typography, audition.art ?? art, true) : undefined} /></div>
    {compare ? <div className="calibration-comparison"><article><h3>Editorial / Publication</h3>{render("editorial", "publication")}</article><article><h3>Condensed Poster / Billboard</h3>{render("poster", "billboard")}</article></div> : null}
  </LabEditor>;
}
