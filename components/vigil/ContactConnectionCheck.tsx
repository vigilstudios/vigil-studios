"use client";
import { useState } from "react";
import { ActionButton } from "./ActionControls";
import { verifyContactConnection } from "@/lib/vigil/actions/contact-connection";

export function ContactConnectionCheck() {
  const [verified,setVerified]=useState(false);
  return <div className="mt-3 space-y-2">
    <ActionButton action={verifyContactConnection} onDone={result=>setVerified(result.ok)}>Verify Cloudflare connection</ActionButton>
    {verified&&<p className="text-sm" role="status">Cloudflare widget API access verified. Widget creation and update permissions are checked during approved launch. No widget or email was created by this check.</p>}
  </div>;
}
