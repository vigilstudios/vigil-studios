import "server-only";
import { contactFirstHtml } from "./booking-policy";
import { ensureProfessionalBindings } from "@/lib/vigil/content/service";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { ExpressDraft } from "./document";
import { parseExpressDraft } from "./document";
import type { DbClient } from "@/lib/vigil/types";
import { ValidationError } from "@/lib/vigil/auth/errors";
import { runtimeManifest } from "@/lib/vigil/professional/workspace";
import { z } from "zod";
import type { SiteDefinition } from "@/design-engine/site/model";
import { serializeSite } from "@/design-engine/site/persistence";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function expressHtml(
  draft: ExpressDraft,
  runtimeBase: string,
  preview = false,
  previewPath?: string,
  websiteId?: string,
): string {
  if (draft.kind === "html") {
    const html = contactFirstHtml(draft.html);
    return !preview && websiteId ? bindLegacyContact(html, websiteId) : html;
  }
  const boundSite =
    websiteId && !preview ? bindWebsiteInquiryForms(draft.site) : draft.site;
  const site = previewPath
    ? {
        ...boundSite,
        pages: boundSite.pages.map((page, index) =>
          index === 0 ? { ...page, routeOverride: previewPath } : page,
        ),
      }
    : boundSite;
  const page = site.pages[0];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.seo.title ?? site.title)}</title><meta name="description" content="${escape(page.seo.description ?? draft.description)}"><meta name="robots" content="${preview ? "noindex,nofollow" : "index,follow"}"><link rel="icon" href="data:,"><link rel="stylesheet" href="${runtimeBase}/client.css"><link rel="stylesheet" href="${runtimeBase}/fonts.css"></head><body><div id="root" data-vigil-page="${escape(page.id)}"${websiteId && !preview ? ` data-vigil-contact="https://www.vigilstudios.co/api/contact/${escape(websiteId)}"` : ""}></div><script id="vigil-site" type="application/json">${serializeSite(site).replace(/</g, "\\u003c")}</script><script src="${runtimeBase}/client.js" defer></script></body></html>`;
}
/** Bind inquiry forms at the host boundary; newsletter/marketing consent remain separate. */
export function bindWebsiteInquiryForms(site: SiteDefinition): SiteDefinition {
  const copy = structuredClone(site);
  for (const page of copy.pages)
    for (const section of page.sections) {
      if (section.component !== "contact.inquiry") continue;
      const form = section.content.form;
      if (form) {
        form.submission = { mode: "host", integration: "inquiries" };
        form.successMessage =
          "Your inquiry was received. Appointments are confirmed separately.";
      }
    }
  return copy;
}
/** Live HTML export adds only an explicit host adapter; authored artwork/styles stay intact. */
export function bindLegacyContact(html: string, websiteId: string): string {
  z.string().uuid().parse(websiteId);
  html = html.replace(/<p class="preview-note">[\s\S]*?<\/p>/g, "");
  const endpoint = `https://www.vigilstudios.co/api/contact/${websiteId}`;
  const booking = html.includes('data-vigil-booking-slot="v1"');
  // Probe the opt-in configuration first; contact-only visitors do not download React/booking assets.
  const bookingLoader = booking
    ? `(async function(){var management=/^#vigil-booking=[a-f0-9-]{36}\\.[a-f0-9]{64}$/.test(location.hash);if(!management){try{var response=await fetch(${JSON.stringify(endpoint.replace("/api/contact/", "/api/bookings/"))},{mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)return;var config=await response.json();if(!Array.isArray(config.services)||!config.services.length)return;}catch(e){return;}}var css=document.createElement('link');css.rel='stylesheet';css.href='https://www.vigilstudios.co/integrations/vigil-bookings-v1.css';document.head.appendChild(css);var script=document.createElement('script');script.src='https://www.vigilstudios.co/integrations/vigil-bookings-v1.js';script.onload=function(){document.querySelectorAll('[data-vigil-booking-slot="v1"]').forEach(function(slot){VigilBookings.connect(slot,${JSON.stringify(websiteId)},true);});};document.head.appendChild(script);})();`
    : "";
  const script = `<script src="https://www.vigilstudios.co/integrations/vigil-contact-v1.js" defer></script><script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('form[data-vigil-contact],form[data-vigil-contact-default],form#booking-form,form#inquiry-form,form#contact-form').forEach(function(form){VigilContact.mountContactForm(form,${JSON.stringify(endpoint)});});${bookingLoader}});</script>`;
  return html.includes("</body>")
    ? html.replace("</body>", script + "</body>")
    : html + script;
}
/** Copy a published snapshot into the customer's repository exactly once. Archived templates remain available to already placed orders. */
export async function expressRepositoryFiles(
  client: DbClient,
  slug: string,
  websiteId?: string,
) {
  const { data, error } = await client
    .from("express_variants")
    .select("published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data?.published)
    throw new ValidationError(`Express variant “${slug}” is not published.`);
  const draft = parseExpressDraft(data.published);
  const files: { path: string; content: string | Buffer }[] = [];
  if (draft.kind === "html")
    files.push({
      path: "site/index.html",
      content: websiteId
        ? bindLegacyContact(contactFirstHtml(draft.html), websiteId)
        : contactFirstHtml(draft.html),
    });
  else {
    if (!draft.engineVersion)
      throw new ValidationError(
        "Published variant has no pinned engine version.",
      );
    const manifest = await runtimeManifest(
      websiteId ? undefined : draft.engineVersion,
    );
    files.push({
      path: "site/index.html",
      content: expressHtml(
        draft,
        `/_vigil/runtime/${manifest.version}`,
        false,
        undefined,
        websiteId,
      ),
    });
    if (websiteId) {
      const { data: website, error: websiteError } = await client
        .from("websites")
        .select("organization_id,project_id")
        .eq("id", websiteId)
        .single();
      if (websiteError) throw websiteError;
      const { data: project, error: projectError } = await client
        .from("projects")
        .select("intake_completed_at")
        .eq("id", website.project_id!)
        .eq("organization_id", website.organization_id)
        .single();
      if (projectError) throw projectError;
      const site = bindWebsiteInquiryForms(draft.site);
      const collections = await ensureProfessionalBindings(
        client,
        websiteId,
        website.organization_id,
        site,
        ["products", "services", "team"],
        !project.intake_completed_at,
      );
      const hash = createHash("sha256")
        .update(websiteId + serializeSite(site) + manifest.version)
        .digest("hex");
      const snapshotId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      const { error: snapshotError } = await client
        .from("website_content_runtimes")
        .upsert(
          {
            id: snapshotId,
            website_id: websiteId,
            organization_id: website.organization_id,
            site_definition:
              site as unknown as import("@/types/database.types").Json,
            engine_version: manifest.version,
            binding_keys: collections
              .filter((c) => c.binding.adapter === "professional")
              .map((c) => c.binding.key),
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (snapshotError) throw snapshotError;
      files.push({
        path: "site/vercel.json",
        content: JSON.stringify(
          {
            cleanUrls: true,
            trailingSlash: false,
            git: { deploymentEnabled: false },
            rewrites: site.pages.map((page) => ({
              source: "/",
              destination: `https://www.vigilstudios.co/api/content/${websiteId}/runtime/${snapshotId}/${page.id}?review=published`,
            })),
          },
          null,
          2,
        ),
      });
    }
    files.push({
      path: ".vigil/express-template.json",
      content: JSON.stringify(
        {
          slug,
          variant: draft.variant,
          engineVersion: manifest.version,
          site: draft.site,
        },
        null,
        2,
      ),
    });
    for (const file of manifest.files) {
      const bytes = await readFile(
        path.join(
          process.cwd(),
          "public/design-engine-runtime",
          manifest.version,
          file.path,
        ),
      );
      if (createHash("sha256").update(bytes).digest("hex") !== file.sha256)
        throw new ValidationError("Pinned template runtime checksum failed.");
      files.push({
        path: `site/_vigil/runtime/${manifest.version}/${file.path}`,
        content: bytes,
      });
    }
  }
  // Only paths present in the authored document are copied; public files cannot escape the asset directories.
  const media = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === "string")
      for (const match of value.matchAll(
        /\/(?:design-engine-[a-z0-9-]+|express-library-media|creators|images|assets)\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg|avif|gif|mp4|webm)/g,
      ))
        media.add(match[0]);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  };
  visit(draft.kind === "site" ? draft.site : draft.html);
  const publicRoot = path.join(process.cwd(), "public");
  for (const asset of media) {
    const absolute = path.resolve(publicRoot, asset.slice(1));
    if (!absolute.startsWith(publicRoot + path.sep))
      throw new ValidationError("Invalid template media path.");
    files.push({ path: `site${asset}`, content: await readFile(absolute) });
  }
  return files;
}
