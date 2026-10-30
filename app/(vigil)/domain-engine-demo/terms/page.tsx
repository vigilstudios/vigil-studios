import { notFound } from "next/navigation";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { assertDomainTestDatabase } from "@/lib/vigil/domain-engine/runtime";
export default function TestDomainTerms() {
  const config = readDomainEngineConfig();
  if (!config.enabled || !config.mockAllowed) notFound();
  const durable = ["namecom", "openprovider"].includes(config.registrar);
  if (durable) {
    try {
      assertDomainTestDatabase();
    } catch {
      notFound();
    }
  } else if (config.registrar !== "mock") notFound();
  return (
    <main
      style={{
        maxWidth: 680,
        margin: "60px auto",
        padding: 24,
        lineHeight: 1.8,
      }}
    >
      <h1>Domain Engine test service terms</h1>
      <p>
        Version: test-v1. These terms apply only to the fictional test
        workspace. No real domain, charge, DNS change or legal registration is
        created.
      </p>
      <p>
        The selected name, one-year term, test price, renewal estimate and
        renewal preference must be approved before a simulated purchase.
        {durable
          ? "Fictional registrant contact information is encrypted in the isolated test database. Test consent and receipts persist for reconciliation."
          : "Fictional registrant contact information is held in server memory for up to one hour."}{" "}
        Use sample details only.
      </p>
      <p>
        Simulated registration failure releases the test authorization. A
        successful simulated registration is retained if capture fails. An
        uncertain registrar response is reconciled without repeating the
        purchase.
      </p>
      <p>
        Domain registration remains independent of hosting. Test renewal
        preferences require explicit approval. Release/transfer requests go to
        assisted review; actual registrar restrictions would apply in
        production.
      </p>
      <p>
        Production terms, registrar agreements, pricing/tax policy and client
        ownership must receive owner and legal approval before real purchasing
        is enabled.
      </p>
    </main>
  );
}
