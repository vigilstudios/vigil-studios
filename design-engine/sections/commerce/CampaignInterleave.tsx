import type { SectionInstance } from "../../composition/schemas";
import { CommerceShell, ProductRecord, num } from "./shared";
import { Picture } from "./ProductPicture";
import { Sequence } from "./Sequence";
export function CampaignInterleave({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.campaign-interleave">) {
  const artwork = (
    <Sequence label="Campaign chapters">
      {content.spreads.map((s, i) => (
        <article className="de-commerce-spread" key={s.id}>
          <div className="de-commerce-spread-story">
            <small>Chapter {num(i)}</small>
            <h3>{s.title}</h3>
            <p>{s.story}</p>
            <Picture treatment={treatment} media={s.campaignMedia} />
          </div>
          <div className="de-commerce-colophon">
            <span className="de-commerce-number">{num(i)}</span>
            <small>The object in this chapter</small>
            <ProductRecord product={s.product} />
          </div>
        </article>
      ))}
    </Sequence>
  );

  return (
    <CommerceShell id={id} content={content} concept="p07">
      {artwork}
    </CommerceShell>
  );
}
