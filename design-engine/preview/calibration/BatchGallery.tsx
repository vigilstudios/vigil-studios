"use client";
import { useState, type ReactNode } from "react";
import { LabEditor } from "../editor/LabEditor";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import { batch003 } from "./batch";
import { BatchStudy } from "./BatchStudy";
export function BatchGallery({ toolbar, workspaceSwitch }: { toolbar?: ReactNode; workspaceSwitch?: ReactNode }) {
  const [selected,setSelected] = useState("H17");
  const [device,setDevice] = useState("desktop");
  const [overview,setOverview] = useState(false);
  const [tab, setTab] = useState("study");
  const c = batch003.find(c=>c.id===selected)!;
  const study = (item:typeof c) => <DesignThemeProvider typography={item.typography} artDirection={item.art} motion="none" overrides={{color:{background:item.palette[0],foreground:item.palette[1],muted:item.palette[1],accent:item.palette[2],surface:item.palette[0],surfaceElevated:item.palette[0],border:item.palette[1]}}}><BatchStudy concept={item}/></DesignThemeProvider>;
  return <LabEditor title="Design Lab" workspaceSwitch={workspaceSwitch} canvasWidth={device === "mobile" && !overview ? 390 : device === "tablet" && !overview ? 768 : 1440} resetKey={`${selected}-${overview}`} activeTab={tab} onTabChange={setTab} toolbar={toolbar}
    tabs={[
      { id: "study", label: "Study", content: <><header className="calibration-intro"><h2>Batch 003 · Twelve different starting points</h2><p>Static concept studies for selection. Actions and interactions inside the artwork are proposed, not implemented. Original concepts are preserved.</p></header><div className="calibration-controls"><label>Hero concept<select disabled={overview} value={selected} onChange={e=>setSelected(e.target.value)}>{batch003.map(c=><option key={c.id} value={c.id}>{c.id} · {c.name}</option>)}</select></label><label>Study viewport<select disabled={overview} value={device} onChange={e=>setDevice(e.target.value)}><option value="desktop">Desktop</option><option value="tablet">Tablet · 768px</option><option value="mobile">Mobile · 390px</option></select></label><button type="button" aria-pressed={overview} onClick={()=>setOverview(!overview)}>Side-by-side review</button></div></> },
      { id: "rationale", label: "Rationale", content: <article className="batch-rationale"><h3>{c.id} · {c.name}</h3><p>{c.thesis}</p><dl><dt>Mechanism</dt><dd>{c.mechanism}</dd><dt>Predictable version rejected</dt><dd>{c.predictable}</dd><dt>Typography / art direction</dt><dd>{c.typography} / {c.art}</dd><dt>Motion / interaction proposal</dt><dd>{c.motion}</dd><dt>Mobile</dt><dd>{c.mobile}</dd><dt>Unrelated brand test</dt><dd>{c.industries.join(" · ")}</dd></dl></article> },
    ]}>
    {!overview ? <div className="calibration-frame">{study(c)}</div> : <div className="batch-overview">{batch003.map(item => <article key={item.id}><h3>{item.id} · {item.name}</h3><div>{study(item)}</div></article>)}</div>}
  </LabEditor>;
}
