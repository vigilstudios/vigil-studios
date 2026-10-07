import type { ReactNode } from "react";
import { SectionActions } from "../../actions/SectionActions";
export function ImportHeading({id,content,hero=false,children}:{id:string;content:{title:string;introduction:string;eyebrow?:string};hero?:boolean;children?:ReactNode}) {
 const Heading=hero?"h1":"h2";
 return <header className="de-import-heading">{content.eyebrow&&<p className="de-accent">{content.eyebrow}</p>}<Heading id={`${id}-title`} className="de-display">{content.title}</Heading><p className="de-text">{content.introduction}</p><SectionActions/>{children}</header>;
}
