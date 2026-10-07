import { SectionActions } from "../../actions/SectionActions";
import { DesignContainer } from "../../primitives/DesignContainer";
import { StaggerItem, StaggerReveal } from "../../motion/StaggerReveal";

export type FeatureListProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: readonly { title: string; body: string }[];
  layout?: "grid" | "list";
  motion?: "none" | "stagger";
};

export function FeatureList({ id, eyebrow, title, description, items, layout = "grid", motion = "none" }: FeatureListProps) {
  const cards = items.map((item) => (
    <article key={item.title} className="de-feature__item"><h3>{item.title}</h3><p>{item.body}</p></article>
  ));
  return (
    <section id={id} className="de-feature" aria-label={title}>
      <DesignContainer>
        <div className="de-feature__heading">
          {eyebrow ? <p className="de-eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {motion === "stagger" ? (
          <StaggerReveal className={`de-feature__items de-feature__items--${layout}`}>
            {cards.map((card, index) => <StaggerItem key={items[index].title}>{card}</StaggerItem>)}
          </StaggerReveal>
        ) : <div className={`de-feature__items de-feature__items--${layout}`}>{cards}</div>}
      <SectionActions/></DesignContainer>
    </section>
  );
}
