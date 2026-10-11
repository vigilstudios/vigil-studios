"use client";

import Link from "next/link";
import { useState } from "react";
import { DesktopLabShell } from "./DesktopLabShell";
import { DesignLab } from "../DesignLab";
import { CompositionLab } from "../composition/CompositionLab";

type Workspace = "design" | "composition";
export function ProfessionalLab({ initialWorkspace = "design" }: { initialWorkspace?: Workspace }) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);

  const workspaceSwitch = <div className="lab-workspace-switch" aria-label="Lab workspace">{(["design", "composition"] as const).map(value => <button key={value} type="button" aria-pressed={workspace === value} onClick={() => {
    setWorkspace(value); window.history.replaceState(null, "", `/admin/lab?workspace=${value}`);
  }}>{value === "design" ? "Design" : "Composition"}</button>)}<Link href="/admin/lab/projects">Client projects</Link><Link href="/admin/lab/express">Express catalog</Link></div>;

  return <DesktopLabShell>
      <div hidden={workspace !== "design"}><DesignLab workspaceSwitch={workspaceSwitch} /></div>
      <div hidden={workspace !== "composition"}><CompositionLab workspaceSwitch={workspaceSwitch} /></div>
  </DesktopLabShell>;
}
