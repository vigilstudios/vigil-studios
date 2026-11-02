import type { ReactNode } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { Plate } from "../work/shared";
import { SectionActions } from "../../actions/SectionActions";
import { HorizontalScroll } from "../../motion/HorizontalScroll";
import { TeamReveal, TeamMotionGroup } from "./TeamReveal";

export function Team(section: SectionInstance<"about.team">) {
  const { title, introduction, members } = section.content;
  if (!members.length) return null;
  const profiles = members.map(member => {
    const photo = member.image ? <div className="de-team-photo" data-de-motion-piece="media"><Plate image={member.image} /></div> : <div className="de-team-photo de-team-initials" aria-hidden="true">{member.name.split(/\s+/).map(word => word[0]).slice(0, 2).join("")}</div>;
    const copy = <div className="de-team-copy" data-de-motion-piece="content"><h3>{member.name}</h3>{member.role && <p className="de-team-role">{member.role}</p>}{section.biography !== "hidden" && member.bio && <p className="de-text">{member.bio}</p>}</div>;
    return <li key={member.id} className="de-team-member"><TeamReveal motion={section.motion} photo={photo} copy={copy} /></li>;
  });
  let directory: ReactNode = <ul className="de-team-members">{profiles}</ul>;
  if (section.flow === "horizontal") directory = <HorizontalScroll label={title} className="de-team-rail"><ul className="de-team-members">{profiles}</ul></HorizontalScroll>;
  return <section id={section.id} className="de-section de-team" data-layout={section.structure} data-flow={section.flow} data-columns={section.columns} data-density={section.density} data-surface={section.surface} data-align={section.alignment} data-portrait={section.portrait} aria-labelledby={`${section.id}-title`}>
    <div className="de-container"><header className="de-team-heading"><h2 id={`${section.id}-title`} className="de-heading">{title}</h2>{introduction && <p className="de-text">{introduction}</p>}</header><TeamMotionGroup motion={section.motion}>{directory}</TeamMotionGroup><SectionActions /></div>
  </section>;
}
