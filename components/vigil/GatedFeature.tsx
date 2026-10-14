import {PremiumWall,type PremiumPreviewKind} from "./PremiumWall";
import { Card, PageHeader } from "./ui";

/** What a customer sees on a route their plan does not include yet. */
export function GatedFeature({
  title,
  description,
  planHint,
  comingSoon = false,
  previewKind = "requests",
  availability = "available",
}: {
  title: string;
  description: string;
  planHint?: string;
  comingSoon?: boolean;
  previewKind?: PremiumPreviewKind;
  availability?: "available" | "coming_soon";
}) {
  return (
    <div>
      <PageHeader title={title} />
      {planHint && !comingSoon ? <PremiumWall feature={title} description={description} planHint={planHint} previewKind={previewKind} note={availability === "coming_soon" ? "This feature is being built. Eligible plans will get access when it is ready." : "Tell Vigil what you need. Your plan keeps the work in one place."}/> : <Card>
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        {comingSoon ? (
          <p className="mt-3 text-sm font-medium">This section is being built and will switch on automatically when it is ready.</p>
        ) : null}
        {planHint ? <p className="mt-3 text-sm font-medium text-[color:var(--accent)]">{planHint}</p> : null}
        <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
          Interested? Email <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a> and we will walk you through it.
        </p>
      </Card>}
    </div>
  );
}
