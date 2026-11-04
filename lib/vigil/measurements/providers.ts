import "server-only";
import { createHash, createSign } from "node:crypto";
import { z } from "zod";
import { getVercelOidcToken } from "@vercel/oidc";
import { DAY, RANGES, rangeStart } from "@/lib/vigil/overview/model";
import {
  fieldPayloadSchema,
  qualityPayloadSchema,
  repositoryPayloadSchema,
  searchPayloadSchema,
  siteSecurityPayloadSchema,
  trafficPayloadSchema,
  type MeasurementKind,
  type MeasurementPayload,
  type TrafficPayload,
} from "./contract";
import {
  MeasurementError,
  providerJson,
  publicHeaders,
  publicOrigin,
  type PublicResponse,
} from "./http";

export type MeasurementConfig = {
  vercelToken?: string;
  vercelTeamId?: string;
  googleKey?: string;
  cruxKey?: string;
  githubToken?: string;
  googleServiceAccount?: string;
  googleWifAudience?: string;
  googleServiceAccountEmail?: string;
};
export function measurementConfig(): MeasurementConfig {
  return {
    vercelToken: process.env.VERCEL_ANALYTICS_TOKEN || process.env.VERCEL_TOKEN,
    vercelTeamId: process.env.VERCEL_TEAM_ID,
    googleKey:
      process.env.PAGESPEED_API_KEY || process.env.GOOGLE_METRICS_API_KEY,
    cruxKey: process.env.CRUX_API_KEY || process.env.GOOGLE_METRICS_API_KEY,
    githubToken: process.env.GITHUB_SECURITY_TOKEN || process.env.GITHUB_TOKEN,
    googleServiceAccount: process.env.GOOGLE_SEARCH_SERVICE_ACCOUNT_JSON,
    googleWifAudience: process.env.GOOGLE_SEARCH_WIF_AUDIENCE,
    googleServiceAccountEmail: process.env.GOOGLE_SEARCH_SERVICE_ACCOUNT_EMAIL,
  };
}
export type MeasurementTarget = {
  origin: string;
  projectId?: string;
  trafficCollectionStartedAt?: string;
  repository?: string;
  repositoryId?: string;
  searchProperty?: string;
};
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const countResponse = z.object({
  data: z.object({ visitors: integer, pageviews: integer }),
});
const aggregateResponse = z.object({
  data: z
    .array(
      z.object({ visitors: integer, pageviews: integer }).catchall(z.unknown()),
    )
    .max(100),
});
const numeric = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new MeasurementError("invalid_response");
  return result.data;
}
function label(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 160)
    : fallback;
}
export function safePageLabel(value: unknown) {
  if (typeof value !== "string") return "Other pages";
  // Paths and referrers never retain query strings, credentials or fragments.
  if (value.startsWith("/") && !value.startsWith("//"))
    return value.split(/[?#]/, 1)[0].slice(0, 160) || "/";
  try {
    return new URL(value).pathname.slice(0, 160) || "/";
  } catch {
    return "Other pages";
  }
}
export async function collectTraffic(
  target: MeasurementTarget,
  config: MeasurementConfig,
  now: Date,
  request: typeof fetch = fetch,
): Promise<TrafficPayload> {
  if (!config.vercelToken || !target.projectId)
    throw new MeasurementError("configuration_required");
  if (!/^[a-zA-Z\d_-]{1,160}$/.test(target.projectId))
    throw new MeasurementError("invalid_mapping");
  const headers = { Authorization: `Bearer ${config.vercelToken}` };
  const collectionStartedAt = target.trafficCollectionStartedAt ?? null;
  if (
    collectionStartedAt &&
    (!z.iso.datetime().safeParse(collectionStartedAt).success ||
      Date.parse(collectionStartedAt) > now.getTime())
  )
    throw new MeasurementError("invalid_mapping");
  const ranges: Record<string, unknown> = {};
  for (const days of RANGES) {
    const start = new Date(
        Math.max(
          rangeStart(now.toISOString(), days),
          collectionStartedAt ? Date.parse(collectionStartedAt) : 0,
        ),
      ).toISOString(),
      end = now.toISOString();
    const query = async (
      mode: "count" | "aggregate",
      by?: string,
      since = start,
      until = end,
    ) => {
      const url = new URL(
        `https://api.vercel.com/v1/query/web-analytics/visits/${mode}`,
      );
      url.searchParams.set("projectId", target.projectId!);
      if (config.vercelTeamId)
        url.searchParams.set("teamId", config.vercelTeamId);
      url.searchParams.set("since", since);
      url.searchParams.set("until", until);
      // Production only. Do not combine the app's preview traffic with client traffic.
      url.searchParams.set("filter", "environment eq 'production'");
      if (by) {
        url.searchParams.set("by", by);
        url.searchParams.set("limit", by === "day" ? "100" : "10");
      }
      return providerJson(url, { headers }, request);
    };
    // Count truncates its end to midnight; aggregates round it up. Explicitly
    // include the current UTC day so totals and daily/ranking data agree.
    const countUntil = new Date(rangeStart(end, 1) + DAY).toISOString();
    const total = parse(
      countResponse,
      await query("count", undefined, start, countUntil),
    ).data;
    const daily: z.infer<typeof aggregateResponse>["data"] = [];
    // Vercel limits daily queries to 62 days. Its date bounds are inclusive;
    // split into non-overlapping 60-day windows without summing visitor totals.
    for (
      let cursor = Date.parse(start);
      cursor <= Date.parse(end);
      cursor += 60 * DAY
    ) {
      const since = new Date(cursor).toISOString();
      const until = new Date(
        Math.min(cursor + 59 * DAY, Date.parse(end)),
      ).toISOString();
      const rows = parse(
        aggregateResponse,
        await query("aggregate", "day", since, until),
      ).data;
      for (const row of rows) {
        if (
          typeof row.timestamp !== "string" ||
          !Number.isFinite(Date.parse(row.timestamp))
        )
          throw new MeasurementError("invalid_response");
        const date = new Date(row.timestamp).toISOString().slice(0, 10);
        if (date < since.slice(0, 10) || date > until.slice(0, 10))
          throw new MeasurementError("invalid_response");
      }
      daily.push(...rows);
    }
    const sources = parse(
      aggregateResponse,
      await query("aggregate", "referrerHostname"),
    ).data;
    const pages = parse(
      aggregateResponse,
      await query("aggregate", "requestPath"),
    ).data;
    const byDay = new Map<string, number>();
    for (const row of daily) {
      if (
        typeof row.timestamp !== "string" ||
        !Number.isFinite(Date.parse(row.timestamp))
      )
        throw new MeasurementError("invalid_response");
      const date = new Date(row.timestamp).toISOString().slice(0, 10);
      if (date < start.slice(0, 10) || date > end.slice(0, 10))
        throw new MeasurementError("invalid_response");
      if (byDay.has(date)) throw new MeasurementError("invalid_response");
      // The provider fills empty buckets even before tracking was installed.
      // Without a verified start, retain activity rather than asserting absences.
      if (!collectionStartedAt && row.visitors === 0 && row.pageviews === 0)
        continue;
      byDay.set(date, row.visitors);
    }
    ranges[String(days)] = {
      // Provider's period visitor count; identities reset daily. Do not invent cross-day people.
      visitors: total.visitors,
      pageViews: total.pageviews,
      periodStart: start,
      periodEnd: end,
      // The provider may lack history before instrumentation began. Missing rows
      // are not evidence of zero activity; chart only dates actually returned.
      series: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, value]) => {
          const date = new Date(`${day}T00:00:00.000Z`);
          return {
            date: date.toISOString(),
            label: date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }),
            value,
          };
        }),
      sources: sources.map((row) => ({
        label: label(row.referrerHostname, "Direct / unknown"),
        value: row.visitors,
      })),
      pages: pages.map((row) => ({
        label: safePageLabel(row.requestPath),
        value: row.pageviews,
      })),
    };
  }
  return parse(trafficPayloadSchema, {
    kind: "traffic",
    timezone: "UTC",
    collectionStartedAt,
    ranges,
  });
}

const lighthouseSchema = z.object({
  lighthouseResult: z.object({
    finalDisplayedUrl: z.string().optional(),
    finalUrl: z.string().optional(),
    requestedUrl: z.string().optional(),
    fetchTime: z.string(),
    lighthouseVersion: z.string(),
    runtimeError: z.unknown().optional(),
    categories: z.record(
      z.string(),
      z.object({ score: z.number().min(0).max(1).nullable() }),
    ),
    audits: z.record(
      z.string(),
      z.object({
        title: z.string().optional(),
        numericValue: z.number().nullable().optional(),
        score: z.number().nullable().optional(),
        scoreDisplayMode: z.string().optional(),
      }),
    ),
  }),
});
export async function collectQuality(
  target: MeasurementTarget,
  device: "mobile" | "desktop",
  config: MeasurementConfig,
  request: typeof fetch = fetch,
) {
  const origin = publicOrigin(target.origin),
    url = new URL(
      "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
  url.searchParams.set("url", `${origin}/`);
  url.searchParams.set("strategy", device);
  for (const category of [
    "performance",
    "seo",
    "accessibility",
    "best-practices",
  ])
    url.searchParams.append("category", category);
  if (config.googleKey) url.searchParams.set("key", config.googleKey);
  const result = parse(
    lighthouseSchema,
    await providerJson(url, {}, request, 70_000),
  ).lighthouseResult;
  if (result.runtimeError) throw new MeasurementError("audit_failed");
  const final =
    result.finalDisplayedUrl || result.finalUrl || result.requestedUrl;
  if (!final || publicOrigin(final) !== origin)
    throw new MeasurementError("target_redirected");
  const readScore = (key: string) => {
    const value = numeric(result.categories[key]?.score);
    return value === null ? null : Math.round(value * 100);
  };
  return parse(qualityPayloadSchema, {
    kind: "quality",
    device,
    auditVersion: result.lighthouseVersion,
    measuredAt: result.fetchTime,
    seo: readScore("seo"),
    performance: readScore("performance"),
    accessibility: readScore("accessibility"),
    bestPractices: readScore("best-practices"),
    lcpMs: numeric(result.audits["largest-contentful-paint"]?.numericValue),
    fcpMs: numeric(result.audits["first-contentful-paint"]?.numericValue),
    cls: numeric(result.audits["cumulative-layout-shift"]?.numericValue),
    tbtMs: numeric(result.audits["total-blocking-time"]?.numericValue),
    issues: Object.entries(result.audits)
      .filter(
        ([, audit]) =>
          audit.score !== null &&
          audit.score !== undefined &&
          audit.score < 0.9 &&
          audit.title &&
          !["manual", "notApplicable", "informative"].includes(
            audit.scoreDisplayMode || "",
          ),
      )
      .slice(0, 12)
      .map(([id, audit]) => ({
        id: id.slice(0, 100),
        title: audit.title!.slice(0, 240),
      })),
  });
}
function dateParts(value: unknown): string | null {
  const parts = z
    .object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
    })
    .safeParse(value);
  return parts.success
    ? `${parts.data.year}-${String(parts.data.month).padStart(2, "0")}-${String(parts.data.day).padStart(2, "0")}`
    : null;
}
export async function collectField(
  target: MeasurementTarget,
  config: MeasurementConfig,
  request: typeof fetch = fetch,
) {
  if (!config.cruxKey) throw new MeasurementError("configuration_required");
  const url = new URL(
    "https://chromeuxreport.googleapis.com/v1/records:queryRecord",
  );
  url.searchParams.set("key", config.cruxKey);
  const result = await providerJson(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: publicOrigin(target.origin),
        formFactor: "PHONE",
        metrics: [
          "largest_contentful_paint",
          "interaction_to_next_paint",
          "cumulative_layout_shift",
        ],
      }),
    },
    request,
    20_000,
    true,
  );
  if (
    (result as { error?: { status?: unknown } })?.error?.status === "NOT_FOUND"
  )
    return parse(fieldPayloadSchema, {
      kind: "field",
      formFactor: "PHONE",
      sufficient: false,
      lcpMs: null,
      inpMs: null,
      cls: null,
      periodStart: null,
      periodEnd: null,
    });
  const record = parse(
    z.object({
      record: z.object({
        key: z.object({ origin: z.string(), formFactor: z.literal("PHONE") }),
        metrics: z.record(
          z.string(),
          z.object({
            percentiles: z
              .object({ p75: z.union([z.string(), z.number()]) })
              .optional(),
          }),
        ),
        collectionPeriod: z.object({
          firstDate: z.unknown(),
          lastDate: z.unknown(),
        }),
      }),
    }),
    result,
  ).record;
  if (publicOrigin(record.key.origin) !== publicOrigin(target.origin))
    throw new MeasurementError("invalid_response");
  const read = (name: string) => {
    const p = record.metrics[name]?.percentiles?.p75;
    return p === undefined ? null : numeric(Number(p));
  };
  const periodStart = dateParts(record.collectionPeriod.firstDate),
    periodEnd = dateParts(record.collectionPeriod.lastDate);
  if (!periodStart || !periodEnd)
    throw new MeasurementError("invalid_response");
  const lcpMs = read("largest_contentful_paint"),
    inpMs = read("interaction_to_next_paint"),
    cls = read("cumulative_layout_shift");
  return parse(fieldPayloadSchema, {
    kind: "field",
    formFactor: "PHONE",
    sufficient: [lcpMs, inpMs, cls].some((value) => value !== null),
    lcpMs,
    inpMs,
    cls,
    periodStart,
    periodEnd,
  });
}

export function securityFromHeaders(response: PublicResponse) {
  const h = response.headers,
    success = response.status >= 200 && response.status < 300;
  return parse(siteSecurityPayloadSchema, {
    kind: "site_security",
    statusCode: response.status,
    checks: [
      {
        id: "https",
        title: "HTTPS response",
        status: success ? "passed" : "attention",
        detail: success
          ? "A valid HTTPS connection returned a successful response."
          : `The HTTPS origin returned HTTP ${response.status}; redirects are not followed.`,
      },
      {
        id: "hsts",
        title: "Strict transport policy",
        status: /max-age=\s*[1-9]\d*/i.test(
          h["strict-transport-security"] || "",
        )
          ? "passed"
          : "attention",
        detail: "Checks for an HSTS header with a positive max-age.",
      },
      {
        id: "content_type",
        title: "Content-type protection",
        status:
          h["x-content-type-options"]?.toLowerCase() === "nosniff"
            ? "passed"
            : "attention",
        detail: "Checks whether X-Content-Type-Options is nosniff.",
      },
      {
        id: "referrer",
        title: "Referrer policy",
        status:
          /^(no-referrer|same-origin|strict-origin|strict-origin-when-cross-origin)$/i.test(
            h["referrer-policy"] || "",
          )
            ? "passed"
            : "attention",
        detail: "Checks for a restrictive Referrer-Policy response header.",
      },
      {
        id: "csp",
        title: "Content security policy",
        status: h["content-security-policy"] ? "passed" : "attention",
        detail:
          "Header presence only; this check does not validate policy effectiveness.",
      },
    ],
  });
}

export async function collectRepository(
  target: MeasurementTarget,
  config: MeasurementConfig,
  request: typeof fetch = fetch,
) {
  if (!config.githubToken || !target.repository)
    throw new MeasurementError("configuration_required");
  if (!/^[\w.-]+\/[\w.-]+$/.test(target.repository))
    throw new MeasurementError("invalid_mapping");
  const headers = {
    Authorization: `Bearer ${config.githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const findings: z.infer<typeof repositoryPayloadSchema>["findings"] = [];
  let complete = false,
    openCount = 0;
  let cursor: string | null = null;
  let repositoryId = target.repositoryId;
  const seenCursors = new Set<string>();
  const endpoint = `https://api.github.com/repos/${target.repository}/dependabot/alerts`;
  const rowSchema = z.object({
    number: integer,
    state: z.literal("open"),
    created_at: z.iso.datetime(),
    security_advisory: z.object({
      summary: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
    }),
  });
  for (let page = 1; page <= 5; page++) {
    const url = new URL(endpoint);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", "100");
    if (cursor) url.searchParams.set("after", cursor);
    let nextLink: string | null = null;
    const capture: typeof fetch = async (input, init) => {
      const response = await request(input, init);
      nextLink = response.headers.get("link");
      return response;
    };
    const rows = parse(
      z.array(rowSchema).max(100),
      await providerJson(url, { headers }, capture),
    );
    openCount += rows.length;
    for (const row of rows)
      if (findings.length < 100)
        findings.push({
          reference: createHash("sha256")
            .update(`${target.repository}:${row.number}`)
            .digest("hex"),
          title: row.security_advisory.summary.slice(0, 240),
          severity: row.security_advisory.severity,
          detectedAt: row.created_at,
        });
    const next = String(nextLink ?? "").match(/<([^>]+)>;\s*rel="next"/);
    if (!next) {
      complete = true;
      break;
    }
    // Use only the returned cursor, never an upstream-supplied credential destination.
    let nextUrl: URL;
    try {
      nextUrl = new URL(next[1]);
    } catch {
      throw new MeasurementError("invalid_response");
    }
    if (
      nextUrl.origin === "https://api.github.com" &&
      /^\/repositories\/\d+\/dependabot\/alerts$/.test(nextUrl.pathname) &&
      !repositoryId
    ) {
      // Older bindings store a full name; resolve the same repository's ID.
      const metadata = parse(
        z.object({ id: integer, full_name: z.string() }),
        await providerJson(
          `https://api.github.com/repos/${target.repository}`,
          { headers },
          request,
        ),
      );
      if (metadata.full_name.toLowerCase() !== target.repository.toLowerCase())
        throw new MeasurementError("invalid_mapping");
      repositoryId = String(metadata.id);
    }
    cursor = nextUrl.searchParams.get("after");
    if (
      nextUrl.origin !== "https://api.github.com" ||
      !(
        nextUrl.pathname === new URL(endpoint).pathname ||
        (repositoryId &&
          /^\d{1,20}$/.test(repositoryId) &&
          nextUrl.pathname ===
            `/repositories/${repositoryId}/dependabot/alerts`)
      ) ||
      nextUrl.username ||
      nextUrl.password ||
      nextUrl.hash ||
      !cursor ||
      cursor.length > 2048 ||
      seenCursors.has(cursor)
    )
      throw new MeasurementError("invalid_response");
    seenCursors.add(cursor);
  }
  return parse(repositoryPayloadSchema, {
    kind: "repository_security",
    complete,
    openCount,
    findings,
  });
}

const accountSchema = z.object({
  client_email: z.email(),
  private_key: z.string().min(100).max(20_000),
  token_uri: z.literal("https://oauth2.googleapis.com/token").optional(),
});
export async function searchAccessToken(
  config: MeasurementConfig,
  now: Date,
  request: typeof fetch,
) {
  if (config.googleWifAudience || config.googleServiceAccountEmail) {
    // No caller-supplied token URLs or credential-source URLs are accepted.
    // Google verifies the Vercel assertion against the pool's explicit trust policy.
    if (
      !/^\/\/iam\.googleapis\.com\/projects\/\d{1,32}\/locations\/global\/workloadIdentityPools\/[a-z][a-z\d-]{3,31}\/providers\/[a-z][a-z\d-]{3,31}$/.test(
        config.googleWifAudience ?? "",
      ) ||
      !/^[a-z][a-z\d-]{4,29}@[a-z][a-z\d-]{4,29}\.iam\.gserviceaccount\.com$/.test(
        config.googleServiceAccountEmail ?? "",
      )
    )
      throw new MeasurementError("configuration_required");
    let subjectToken: string;
    try {
      subjectToken = await getVercelOidcToken();
      if (!subjectToken || subjectToken.length > 32_768) throw new Error();
    } catch {
      throw new MeasurementError("configuration_required");
    }
    const token = parse(
      z.object({ access_token: z.string().min(1).max(16_384) }),
      await providerJson(
        "https://sts.googleapis.com/v1/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            audience: config.googleWifAudience!,
            requested_token_type:
              "urn:ietf:params:oauth:token-type:access_token",
            subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
            subject_token: subjectToken,
            scope: "https://www.googleapis.com/auth/cloud-platform",
          }),
        },
        request,
      ),
    );
    return parse(
      z.object({ accessToken: z.string().min(1).max(16_384) }),
      await providerJson(
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.googleServiceAccountEmail!)}:generateAccessToken`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scope: ["https://www.googleapis.com/auth/webmasters.readonly"],
            lifetime: "600s",
          }),
        },
        request,
      ),
    ).accessToken;
  }
  if (!config.googleServiceAccount)
    throw new MeasurementError("configuration_required");
  let credentials: z.infer<typeof accountSchema>;
  try {
    credentials = parse(accountSchema, JSON.parse(config.googleServiceAccount));
  } catch {
    throw new MeasurementError("configuration_required");
  }
  const issued = Math.floor(now.getTime() / 1000);
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: credentials.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: issued, exp: issued + 3600 })}`;
  let signature: string;
  try {
    signature = createSign("RSA-SHA256")
      .update(unsigned)
      .sign(credentials.private_key, "base64url");
  } catch {
    throw new MeasurementError("configuration_required");
  }
  return parse(
    z.object({ access_token: z.string().min(1) }),
    await providerJson(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: `${unsigned}.${signature}`,
        }),
      },
      request,
    ),
  ).access_token;
}
export async function collectSearch(
  target: MeasurementTarget,
  config: MeasurementConfig,
  now: Date,
  request: typeof fetch = fetch,
) {
  const origin = publicOrigin(target.origin);
  if (
    !target.searchProperty ||
    ![`${origin}/`, `sc-domain:${new URL(origin).hostname}`].includes(
      target.searchProperty,
    )
  )
    throw new MeasurementError("configuration_required");
  const token = await searchAccessToken(config, now, request);
  // Search Console dates are Pacific, with finalized data and a three-day lag.
  const end = new Date(now.getTime() - 3 * DAY).toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 27);
  const periodStart = start.toISOString().slice(0, 10),
    periodEnd = end;
  const row = z.object({
    keys: z.array(z.string()).optional(),
    clicks: integer,
    impressions: integer,
    ctr: z.number().min(0).max(1),
    position: z.number().finite().nonnegative(),
  });
  const query = async (dimensions: string[]) =>
    parse(
      z.object({ rows: z.array(row).max(10).optional() }),
      await providerJson(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target.searchProperty!)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: periodStart,
            endDate: periodEnd,
            dataState: "final",
            type: "web",
            dimensions,
            rowLimit: 10,
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: "page",
                    operator: "includingRegex",
                    expression: `^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`,
                  },
                ],
              },
            ],
          }),
        },
        request,
      ),
    ).rows ?? [];
  const totals = await query([]),
    queries = await query(["query"]);
  if (totals.length > 1) throw new MeasurementError("invalid_response");
  return parse(searchPayloadSchema, {
    kind: "search",
    periodStart,
    periodEnd,
    timezone: "America/Los_Angeles",
    clicks: totals[0]?.clicks ?? null,
    impressions: totals[0]?.impressions ?? null,
    ctr: totals[0]?.ctr ?? null,
    position: totals[0]?.impressions ? totals[0].position : null,
    queries: queries.map((item) => ({
      label: label(item.keys?.[0], "Unknown query"),
      clicks: item.clicks,
      impressions: item.impressions,
    })),
  });
}

export async function collectMeasurement(
  kind: MeasurementKind,
  target: MeasurementTarget,
  config = measurementConfig(),
  now = new Date(),
  request: typeof fetch = fetch,
): Promise<MeasurementPayload> {
  publicOrigin(target.origin);
  switch (kind) {
    case "traffic":
      return collectTraffic(target, config, now, request);
    case "quality_mobile":
      return collectQuality(target, "mobile", config, request);
    case "quality_desktop":
      return collectQuality(target, "desktop", config, request);
    case "field_performance":
      return collectField(target, config, request);
    case "site_security":
      return securityFromHeaders(await publicHeaders(target.origin));
    case "repository_security":
      return collectRepository(target, config, request);
    case "search":
      return collectSearch(target, config, now, request);
  }
}
