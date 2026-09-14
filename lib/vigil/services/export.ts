import "server-only";

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import type { Website } from "@/lib/vigil/types";

/**
 * Site export (master architecture §5): the customer can take a clean copy
 * of the site-specific code and assets they own. Platform code, the
 * template system as a reusable whole, and provider credentials are never
 * included.
 *
 * Where the files come from is a source behind an interface. Today the only
 * source is the current published build of an Express site; a repository or
 * deployment-provider source slots in later without touching the route.
 */
export type SiteFile = { path: string; content: Buffer | string };

export interface SiteSource {
  readonly name: string;
  /** Files for this website, or null when this source does not apply. */
  collect(website: Website): Promise<SiteFile[] | null>;
}

const templateSlugs = new Set(EXPRESS_TEMPLATES.map((t) => t.slug));

/** The current published Express build: the self-contained HTML page. */
export const expressTemplateSource: SiteSource = {
  name: "express-template",
  async collect(website) {
    if (!website.template_slug || !templateSlugs.has(website.template_slug)) return null;
    const file = path.join(process.cwd(), "public", "express-templates", `${website.template_slug}.html`);
    const html = await readFile(file, "utf8");
    return [{ path: "site/index.html", content: html }];
  },
};

/**
 * The customer's own folder: `websites.repository_ref` names a directory
 * (e.g. `clients/<org-slug>`) under VIGIL_CLIENTS_ROOT — by default the
 * parent of this repo, where `Websites/clients/` lives. `site/` is the
 * deployable site and is required; `content/` (what the customer supplied)
 * and a README are included when present. Absent folder = source does not
 * apply, so the template fallback still works where the folder is not
 * checked out (a serverless deploy, for instance).
 */
export const repositorySource: SiteSource = {
  name: "repository",
  async collect(website) {
    const ref = website.repository_ref?.trim();
    if (!ref) return null;
    const root = path.resolve(process.env.VIGIL_CLIENTS_ROOT ?? path.join(process.cwd(), ".."));
    const dir = path.resolve(root, ref);
    if (dir !== root && !dir.startsWith(root + path.sep)) return null; // no escaping the root
    const site = path.join(dir, "site");
    if (!(await isDir(site))) return null;
    const files: SiteFile[] = [];
    await walk(site, "site", files);
    const content = path.join(dir, "content");
    if (await isDir(content)) await walk(content, "content", files);
    for (const name of ["README.md", "readme.md"]) {
      const f = path.join(dir, name);
      if (await isFile(f)) {
        files.push({ path: "PROJECT-README.md", content: await readFile(f) });
        break;
      }
    }
    return files.length > 0 ? files : null;
  },
};

const SKIP = new Set(["node_modules", ".git", ".DS_Store", ".next", ".vercel", ".env", ".env.local"]);

async function walk(dir: string, prefix: string, out: SiteFile[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (SKIP.has(e.name) || e.name.startsWith(".env")) continue;
    const full = path.join(dir, e.name);
    const rel = `${prefix}/${e.name}`;
    if (e.isDirectory()) await walk(full, rel, out);
    else if (e.isFile()) out.push({ path: rel, content: await readFile(full) });
  }
}

async function isDir(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

/** Order matters: the customer's own folder wins over the template capture. */
const sources: SiteSource[] = [repositorySource, expressTemplateSource];

export class ExportUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportUnavailableError";
  }
}

export type ExportContext = {
  organizationName: string;
  exportedBy: string;
  exportedAt?: Date;
};

/** Build the zip. Throws ExportUnavailableError when no source has files for this site. */
export async function buildSiteExport(website: Website, ctx: ExportContext): Promise<{ filename: string; bytes: Buffer; fileCount: number; source: string }> {
  let files: SiteFile[] | null = null;
  let sourceName = "";
  for (const source of sources) {
    files = await source.collect(website);
    if (files) {
      sourceName = source.name;
      break;
    }
  }
  if (!files || files.length === 0) {
    throw new ExportUnavailableError("There is no published build of this site to export yet.");
  }

  const exportedAt = ctx.exportedAt ?? new Date();
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content);
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        website: { id: website.id, name: website.name, template: website.template_slug, live_url: website.live_url },
        organization: ctx.organizationName,
        exported_at: exportedAt.toISOString(),
        exported_by: ctx.exportedBy,
        source: sourceName,
        files: files.map((f) => f.path),
      },
      null,
      2
    )
  );
  zip.file("README.md", readme(website, ctx, exportedAt, files));

  const bytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const slug = website.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
  const stamp = exportedAt.toISOString().slice(0, 10);
  return { filename: `${slug}-site-${stamp}.zip`, bytes, fileCount: files.length, source: sourceName };
}

function readme(website: Website, ctx: ExportContext, exportedAt: Date, files: SiteFile[]): string {
  return `# ${website.name} — site export

Exported ${exportedAt.toUTCString()} for ${ctx.organizationName} by ${ctx.exportedBy}.

## What is in this archive

${files.map((f) => `- \`${f.path}\``).join("\n")}
- \`manifest.json\` — what was exported and when

\`site/\` is your website as it is built and published: static files you can
host anywhere. Open \`site/index.html\` in a browser to check it. \`content/\`
(when present) holds the text, images and documents you supplied.

## What you own

Under your service agreement with Vigil Studios you own the site-specific
source code, content and assets produced for your project — that is what
this archive contains. It does not include Vigil platform code, the shared
template system as a reusable whole, deployment automation, provider
credentials, or other Vigil intellectual property. Your domain is yours and
is managed at your registrar.

## Need help moving it?

Email hello@vigilstudios.co. Migration assistance and support windows are
described in your service agreement.
`;
}
