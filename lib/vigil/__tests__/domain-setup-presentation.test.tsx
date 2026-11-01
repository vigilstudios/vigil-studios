import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/vigil/actions/onboarding", () => ({
  confirmDnsAdded: vi.fn(),
  getDomainSetup: vi.fn(),
  guessRegistrar: vi.fn(),
  startOnboardingDomain: vi.fn(),
}));
vi.mock("@/lib/vigil/actions/domain-commerce", () => ({
  findVercelDomain: vi.fn(),
  getDomainHandoff: vi.fn(),
  updateDomainHandoff: vi.fn(),
}));
vi.mock("@/lib/vigil/actions/domain", () => ({
  startDomainConnection: vi.fn(),
}));
import { domainSchema } from "../onboarding/brief";
import { EmbeddedTestCheckout } from "@/components/vigil/domain-engine/EmbeddedTestCheckout";
import { DomainWorkspace } from "@/components/vigil/domain-engine/DomainWorkspace";
import { DomainReadyHandoff, DomainSetupSteps } from "@/components/vigil/domain-engine/DomainSetupUI";
import { DomainStep } from "@/app/(vigil)/dashboard/onboarding/steps/DomainStep";

describe("simple domain setup presentation", () => {
  it("ends verified setup with an admin handoff and a return to preview", () => {
    const html = renderToStaticMarkup(<DomainReadyHandoff simulation={false} automaticConnection staffNotified />);
    expect(html).toContain("Vigil has been notified");
    expect(html).toContain("when Vigil deploys your finished, approved website");
    expect(html).toContain('href="/dashboard/website"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Approve");
    expect(html).not.toContain("Deploy Live");
  });
  it("does not invent sent alerts or automatic permission for older purchases", () => {
    const html = renderToStaticMarkup(<DomainReadyHandoff simulation={false} automaticConnection={false} staffNotified={false} />);
    expect(html).toContain("Your setup is saved");
    expect(html).not.toContain("has been notified");
    expect(html).not.toContain("connect automatically");
  });
  it("explains domains with an address example before showing any purchase form", () => {
    const html = renderToStaticMarkup(
      <DomainWorkspace simulation discoveryOnly />,
    );
    expect(html).toContain("A domain is your website’s address");
    expect(html).toContain("yourbusiness");
    expect(html).toContain("Not sure if you have a domain?");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("I approve");
  });
  it("shows a checkout loading state without exposing its secret in rendered markup", () => {
    const html = renderToStaticMarkup(
      <EmbeddedTestCheckout
        live
        clientSecret="secret_QA_ONLY"
        publishableKey="pk_live_QA_ONLY"
        onComplete={vi.fn()}
      />,
    );
    expect(html).toContain("Loading secure checkout");
    expect(html).toContain("authorized first");
    expect(html).not.toContain("secret_QA_ONLY");
  });
  it("offers saved-order recovery when checkout configuration is missing", () => {
    const html = renderToStaticMarkup(
      <EmbeddedTestCheckout
        live
        clientSecret="secret_QA_ONLY"
        publishableKey=""
        onComplete={vi.fn()}
      />,
    );
    expect(html).toContain("Your order is saved");
    expect(html).not.toContain("Loading secure checkout");
    expect(html).not.toContain("secret_QA_ONLY");
  });
  it("does not let the step indicator skip consents or create a checkout", () => {
    const html = renderToStaticMarkup(<DomainSetupSteps current={1} />);
    expect(html).toContain('aria-current="step"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("href=");
  });
  it("lets staff discover names while explaining that only the owner can purchase", () => {
    const html = renderToStaticMarkup(
      <DomainWorkspace
        live
        discoveryOnly
        canManage={false}
        initialScreen="search"
      />,
    );
    expect(html).toContain("Search addresses");
    expect(html).toContain("owner must sign in directly");
    expect(html).not.toContain("Continue to payment");
    expect(html).not.toContain("clientSecret");
  });
  it("blocks new purchases while a saved order is being restored", () => {
    const html = renderToStaticMarkup(
      <DomainWorkspace live initialScreen="search" />,
    );
    expect(html).toContain("Loading saved setup");
    expect(html).not.toContain("Search addresses");
    expect(html).not.toContain("<form");
  });
  it("keeps managed-domain access read-only when the owner is not signed in directly", () => {
    const html = renderToStaticMarkup(
      <DomainWorkspace live canManage={false} initialScreen="progress" />,
    );
    expect(html).toContain("customer owner must sign in directly");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<form");
  });
  it("resumes onboarding purchases in the managed workspace rather than manual DNS instructions", () => {
    const html = renderToStaticMarkup(
      <DomainStep
        managedDomain
        liveDomainEnabled
        canPurchase
        canManage
        projectId="project"
        websiteId="website"
        businessName="Willow"
        initialIntent={null}
        initial={domainSchema.parse({ answer: "need", later: false })}
        domain={{
          domainId: "domain",
          hostname: "willow.com",
          registrar: "other",
          status: "pending",
          records: [],
          dnsOk: null,
          sslOk: null,
          reachable: null,
          launchReady: false,
          statusReason: null,
          cutoverReady: false,
        }}
        onDomain={vi.fn()}
        save={async () => true}
        onSaveState={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(html).toContain("Domain and hosting setup");
    expect(html).not.toContain("Where do you manage");
    expect(html).not.toContain("Guided domain setup");
    expect(html).toContain("Do this later");
  });
});
