import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferingsStep } from "@/app/(vigil)/dashboard/onboarding/steps/OfferingsStep";

describe("fresh offering form hydration", () => {
  it("keeps input IDs and labels identical across independent initial renders", () => {
    const render = () => renderToStaticMarkup(<OfferingsStep
      initial={undefined}
      projectId="project"
      organizationId="organization"
      assets={[]}
      onAssets={() => undefined}
      save={async () => true}
      onSaveState={() => undefined}
      onBack={() => undefined}
      onNext={() => undefined}
    />);
    const server = render(), browser = render();
    const inputIds = (html: string) => [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
    const ids = inputIds(server);
    expect(ids).toHaveLength(4);
    expect(inputIds(browser)).toEqual(ids);
    for (const id of ids) {
      expect(server).toContain(`for="${id}"`);
      expect(browser).toContain(`for="${id}"`);
    }
  });
});
