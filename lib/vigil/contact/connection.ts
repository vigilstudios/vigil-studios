import "server-only";
import { ContactCloudflare, ContactProvisioningError, contactConnectionReady } from "./cloudflare";

/** Verifies the widget API accepts the server credentials without provisioning a website. */
export async function verifyContactAccountAccess(): Promise<void> {
  if (!contactConnectionReady()) {
    throw new ContactProvisioningError("Add the Cloudflare account ID, Turnstile API token and Resend configuration to Production, then redeploy.");
  }
  const provider = new ContactCloudflare(process.env.CLOUDFLARE_ACCOUNT_ID!, process.env.CLOUDFLARE_TURNSTILE_API_TOKEN!);
  // Listing verifies API access; actual create/update permission is checked by the launch job.
  await provider.find("vigil-connection-check");
}
