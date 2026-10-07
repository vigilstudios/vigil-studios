import { SectionActions } from "../../actions/SectionActions";
import { DesignContainer } from "../../primitives/DesignContainer";
import { FadeReveal } from "../../motion/FadeReveal";

export type StatementHeroProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description: string;
  action: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  alignment?: "start" | "center";
  emphasis?: "quiet" | "strong";
  motion?: "none" | "fade";
};

export function StatementHero({ id = "top", eyebrow, title, description, action, secondaryAction, alignment = "start", emphasis = "quiet", motion = "none" }: StatementHeroProps) {
  const content = (
    <div className="de-hero__content">
      {eyebrow ? <p className="de-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p className="de-hero__description">{description}</p>
      <div className="de-hero__actions">
        <SectionActions primary={action} secondary={secondaryAction} />
      </div>
    </div>
  );
  return (
    <section id={id} className={`de-hero de-hero--${alignment} de-hero--${emphasis}`} aria-label="Introduction">
      <DesignContainer>{motion === "fade" ? <FadeReveal>{content}</FadeReveal> : content}</DesignContainer>
    </section>
  );
}
