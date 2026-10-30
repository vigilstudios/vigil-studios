import { notFound } from "next/navigation";
import { DomainWorkspace } from "@/components/vigil/domain-engine/DomainWorkspace";
import { assertDomainTestDatabase } from "@/lib/vigil/domain-engine/runtime";
import { domainTestRegistrar } from "@/lib/vigil/domain-engine/test-registrar";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireOrgContextOrThrow,
  assertOrgRole,
} from "@/lib/vigil/auth/session";
export default async function DomainTestPage() {
  try {
    assertDomainTestDatabase();
    domainTestRegistrar(createAdminClient());
  } catch {
    notFound();
  }
  const ctx = await requireOrgContextOrThrow();
  await assertOrgRole(ctx, ["owner"]);
  if (ctx.isImpersonating) notFound();
  const key = process.env.NEXT_PUBLIC_VIGIL_DOMAIN_STRIPE_TEST_KEY ?? "";
  if (!key.startsWith("pk_test_")) notFound();
  const { data: websites, error: websitesError } = await createAdminClient()
    .from("websites")
    .select("id,name")
    .eq("organization_id", ctx.organization.id);
  if (websitesError) throw websitesError;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <DomainWorkspace
        simulation
        stripeTest
        testClientName={ctx.organization.name}
        testWebsites={(websites ?? []).map((website) => ({
          id: website.id,
          label: website.name,
        }))}
        publishableTestKey={key}
        testRegistrar={
          process.env.VIGIL_DOMAIN_REGISTRAR === "namecom"
            ? "namecom"
            : process.env.VIGIL_DOMAIN_REGISTRAR === "openprovider"
              ? "openprovider"
              : "mock"
        }
      />
    </main>
  );
}
