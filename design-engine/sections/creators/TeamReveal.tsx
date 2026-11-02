"use client";
import type { ReactNode } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { StaggerReveal, StaggerItem } from "../../motion/StaggerReveal";
import { FadeReveal } from "../../motion/FadeReveal";
import { MaskReveal } from "../../motion/MaskReveal";
import { MediaReveal } from "../../motion/MediaReveal";
import { usePresentation } from "../../presentation/PresentationContext";

/** Section-wide entrance/exit controls remain independent of this optional native reveal. */
export function TeamReveal({ motion, photo, copy }: { motion: SectionInstance<"about.team">["motion"]; photo: ReactNode; copy: ReactNode }) {
  const presentation = usePresentation();
  if (presentation.motionMode === "override" || presentation.motionMode === "none") motion = "none";
  let portrait = photo, text = copy;
  if (motion === "media-reveal") portrait = <MediaReveal>{photo}</MediaReveal>;
  // Static-image policy never animates an image or an ancestor containing it.
  if (motion === "stagger") {
    text = <StaggerItem>{copy}</StaggerItem>;
    if (presentation.imageMotion !== "static") portrait = <StaggerItem>{photo}</StaggerItem>;
  }
  if (motion === "fade") {
    text = <FadeReveal distance={16}>{copy}</FadeReveal>;
    if (presentation.imageMotion !== "static") portrait = <FadeReveal>{photo}</FadeReveal>;
  }
  if (motion === "mask") {
    text = <MaskReveal>{copy}</MaskReveal>;
    if (presentation.imageMotion !== "static") portrait = <MaskReveal>{photo}</MaskReveal>;
  }
  return <div className="de-team-profile">{portrait}{text}</div>;
}

export function TeamMotionGroup({motion,children}:{motion:SectionInstance<"about.team">["motion"];children:ReactNode}){
 const presentation=usePresentation();
 return motion==="stagger"&&presentation.motionMode!=="override"&&presentation.motionMode!=="none"?<StaggerReveal>{children}</StaggerReveal>:children;
}
