import type { ReactNode } from "react";
import { FadeReveal } from "../../motion/FadeReveal";
/** Behavior none really is static, even in a page with expressive global motion. */
export function EvidenceReveal({motion,children}:{motion:string;children:ReactNode}) { return motion === "fade" ? <FadeReveal distance={0}>{children}</FadeReveal> : <>{children}</>; }
