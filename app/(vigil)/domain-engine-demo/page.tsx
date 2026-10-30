import { ThemeSwitch } from "@/components/vigil/ThemeSwitch";
import { notFound } from "next/navigation";
import { DomainWorkspace } from "@/components/vigil/domain-engine/DomainWorkspace";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
export const dynamic = "force-dynamic";
export const metadata = { title: "Domain Engine test workspace" };
export default function DomainEngineDemo() {
  const config = readDomainEngineConfig();
  if (!config.enabled || !config.mockAllowed || config.registrar !== "mock")
    notFound();
  return (
    <main
      style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 20px 80px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <ThemeSwitch showLabel />
      </div>
      <DomainWorkspace simulation />
    </main>
  );
}
