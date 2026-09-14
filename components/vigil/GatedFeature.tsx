import { Card, PageHeader } from "./ui";

/** What a customer sees on a route their plan does not include yet. */
export function GatedFeature({
  title,
  description,
  planHint,
  comingSoon = false,
}: {
  title: string;
  description: string;
  planHint?: string;
  comingSoon?: boolean;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{description}</p>
        {comingSoon ? (
          <p className="mt-3 text-sm font-medium">This section is being built and will switch on automatically when it is ready.</p>
        ) : null}
        {planHint ? <p className="mt-3 text-sm font-medium text-[color:var(--accent)]">{planHint}</p> : null}
        <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
          Interested? Email <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a> and we will walk you through it.
        </p>
      </Card>
    </div>
  );
}
