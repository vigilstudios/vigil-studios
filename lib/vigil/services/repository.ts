import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import { NotFoundError, ValidationError } from "@/lib/vigil/auth/errors";
import { slugify } from "@/lib/vigil/format";
import { GitHubRepositoryProvider } from "@/lib/vigil/providers/github";
import type { DbClient } from "@/lib/vigil/types";
import { findProviderLink, upsertProviderLink } from "./provider-links";

const templateSlugs = new Set(EXPRESS_TEMPLATES.map((template) => template.slug));

export async function assertWebsiteRepositoryReady(admin: DbClient, websiteId: string): Promise<void> {
  const repository = await findProviderLink(admin, {
    provider: "other",
    resourceKind: "repository",
    entityType: "website",
    entityId: websiteId,
  });
  if (!repository) throw new ValidationError("Create the customer repository before deploying a preview or live site.");
}

/** Create (or recover) the private customer repository and seed its site. */
export async function provisionWebsiteRepository(
  admin: DbClient,
  websiteId: string,
  provider = new GitHubRepositoryProvider()
): Promise<{ repositoryId: number; fullName: string; htmlUrl: string; created: boolean }> {
  const existing = await findProviderLink(admin, {
    provider: "other",
    resourceKind: "repository",
    entityType: "website",
    entityId: websiteId,
  });
  if (existing) {
    const metadata = existing.metadata as { full_name?: string; html_url?: string };
    if (metadata.full_name) {
      return { repositoryId: Number(existing.external_id), fullName: metadata.full_name, htmlUrl: metadata.html_url ?? `https://github.com/${metadata.full_name}`, created: false };
    }
  }

  const { data: website, error } = await admin
    .from("websites")
    .select("id, name, template_slug, organization:organizations!websites_organization_id_fkey(slug, name)")
    .eq("id", websiteId)
    .maybeSingle();
  if (error) throw error;
  if (!website) throw new NotFoundError(`Website ${websiteId} not found.`);
  const organization = Array.isArray(website.organization) ? website.organization[0] : website.organization;
  if (!organization) throw new NotFoundError("The website organization was not found.");

  const repoName = repositoryName(organization.slug, websiteId);
  const html = await initialHtml(website.template_slug, organization.name);
  const repository = await provider.ensureRepository({
    name: repoName,
    description: `${organization.name} website, managed by Vigil Studios`,
    files: [
      { path: "site/index.html", content: html },
      { path: "content/.gitkeep", content: "" },
      { path: ".gitignore", content: ".DS_Store\n.env\n.env.*\n.vercel\nnode_modules\n" },
      { path: "README.md", content: repositoryReadme(organization.name, website.template_slug) },
    ],
  });

  await upsertProviderLink(admin, {
    provider: "other",
    resourceKind: "repository",
    externalId: String(repository.id),
    entityType: "website",
    entityId: websiteId,
    metadata: { provider: "github", full_name: repository.fullName, html_url: repository.htmlUrl, default_branch: repository.defaultBranch },
  });
  const { error: updateError } = await admin
    .from("websites")
    .update({ repository_ref: `github:${repository.fullName}`, hosting_mode: "dedicated" })
    .eq("id", websiteId);
  if (updateError) throw updateError;
  return { repositoryId: repository.id, fullName: repository.fullName, htmlUrl: repository.htmlUrl, created: true };
}

function repositoryName(orgSlug: string, websiteId: string): string {
  const prefix = slugify(process.env.GITHUB_REPOSITORY_PREFIX || "client");
  const base = slugify(orgSlug) || `site-${websiteId.slice(0, 8)}`;
  return `${prefix ? `${prefix}-` : ""}${base}`.slice(0, 100);
}

async function initialHtml(templateSlug: string | null, organizationName: string): Promise<string> {
  if (templateSlug) {
    if (!templateSlugs.has(templateSlug)) throw new ValidationError(`Unknown Express template “${templateSlug}”.`);
    return readFile(path.join(process.cwd(), "public", "express-templates", `${templateSlug}.html`), "utf8");
  }
  const safeName = organizationName.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title></head><body><main><h1>${safeName}</h1><p>Your new website is being built.</p></main></body></html>\n`;
}

function repositoryReadme(organizationName: string, templateSlug: string | null): string {
  return `# ${organizationName} website

Private customer website repository managed by Vigil Studios.

- \`site/\` is the Vercel project root and contains the deployable website.
- \`content/\` holds approved customer copy and assets used during the build.
- Production deploys are started from the Vigil admin dashboard after review.
${templateSlug ? `- Initial source: Vigil Express template \`${templateSlug}\`.` : "- Initial source: custom-build starter."}

Do not commit credentials or customer access tokens.
`;
}
