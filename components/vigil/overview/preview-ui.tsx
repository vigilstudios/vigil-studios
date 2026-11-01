import type { CSSProperties, ReactNode } from "react";
import type { CustomerStatus } from "@/lib/vigil/lifecycle";

export function PreviewCard({ id, title, icon, action, children, className = "", style }: { id: string; title: string; icon: ReactNode; action?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={`ov-card pv-card pv-card-${id} ${className}`} style={style} aria-labelledby={`preview-${id}-heading`}><div className="ov-card-heading"><h2 id={`preview-${id}-heading`}>{icon}{title}</h2>{action}</div><div className="ov-card-body">{children}</div></section>;
}

export function PreviewStatus({ status }: { status: CustomerStatus }) {
  return <span className="pv-status" data-tone={status.tone}><i aria-hidden="true" />{status.label}</span>;
}
