import {
  DAY,
  leadReport,
  type OverviewData,
  type LeadDatum,
  type InboxLead,
} from "@/lib/vigil/overview/model";
export function sampleOverview(
  empty = false,
  disconnected = false,
): OverviewData {
  const asOf = "2026-10-26T18:30:00Z";
  const rows: LeadDatum[] = [];
  for (let day = 0; day < 180; day++) {
    const count = empty
      ? 0
      : Math.max(
          0,
          Math.round(
            (day < 30 ? 3 : 1.9) +
              Math.sin(day * 1.25) * 2 +
              (day % 11 === 0 ? 4 : 0),
          ),
        );
    for (let i = 0; i < count; i++)
      rows.push({
        received_at: new Date(
          Date.parse(asOf) - day * DAY - i * 3600000,
        ).toISOString(),
        status:
          rows.length < 8
            ? "new"
            : (
                [
                  "contacted",
                  "qualified",
                  "booked",
                  "won",
                  "won",
                  "lost",
                ] as const
              )[(day + i) % 6],
        source: day % 3 === 0 ? "consultation" : "contact-form",
      });
  }
  const reports = {
    7: leadReport(rows, 7, asOf),
    30: leadReport(rows, 30, asOf),
    90: leadReport(rows, 90, asOf),
  };
  const people = [
    "Olivia Bennett",
    "James Carter",
    "Sofia Rivera",
    "Henry Wilson",
    "Maya Chen",
  ];
  const queue: InboxLead[] = empty
    ? []
    : people.map((name, i) => ({
        id: `sample-${i}`,
        contact: { name, email: `sample${i}@example.com` },
        status: "new",
        received_at:
          rows
            .filter((row) => row.status === "new")
            .toSorted(
              (a, b) => Date.parse(a.received_at) - Date.parse(b.received_at),
            )[i]?.received_at ?? asOf,
        read_at: i > 2 ? asOf : null,
        source: i % 2 ? "contact-form" : "consultation",
      }));
  return {
    asOf,
    organizationName: "Marlow & Fen",
    userName: "Alex Morgan",
    site: {
      id: "sample-site",
      name: "Marlow & Fen",
      live_url: "/sample-site.html",
      health_ok: true,
      last_health_at: asOf,
      last_deployed_at: "2026-10-23T14:20:00Z",
      export_eligible: false,
      code_ownership: "customer_owned",
    },
    sites: [{ id: "sample-site", name: "Marlow & Fen" }],
    domain: {
      hostname: "marlowandfen.example",
      dns_ok: true,
      ssl_ok: true,
      last_checked_at: asOf,
    },
    reports,
    historyCount: rows.length,
    completeHistory: true,
    queue,
    recent: queue.map((row, i) => ({
      ...row,
      status: (["new", "contacted", "qualified", "booked", "won"] as const)[i],
    })),
    awaiting: empty ? 0 : 8,
    unread: empty ? 0 : 3,
    captureEnabled: !disconnected,
    traffic: disconnected
      ? null
      : (Object.fromEntries(
          ([7, 30, 90] as const).map((range) => {
            const series = reports[range].series.map((point, i) => ({
              ...point,
              value: empty
                ? 0
                : Math.round(
                    (range === 90 ? 550 : 90) + Math.sin(i * 0.6) * 38 + i * 2,
                  ),
            }));
            const visitors = series.reduce(
                (sum, point) => sum + point.value,
                0,
              ),
              pageViews = Math.round(visitors * 2.4);
            const sourceValues = [
              Math.floor(visitors * 0.51),
              Math.floor(visitors * 0.24),
              Math.floor(visitors * 0.15),
            ];
            const pageValues = [
              Math.floor(pageViews * 0.4),
              Math.floor(pageViews * 0.28),
              Math.floor(pageViews * 0.2),
            ];
            return [
              range,
              {
                visitors,
                pageViews,
                series,
                sources: [
                  "Organic search",
                  "Direct",
                  "Instagram",
                  "Referral",
                ].map((label, i) => ({
                  label,
                  value:
                    i === 3
                      ? visitors - sourceValues.reduce((a, b) => a + b, 0)
                      : sourceValues[i],
                })),
                pages: ["/", "/our-work", "/studio", "/contact"].map(
                  (label, i) => ({
                    label,
                    value:
                      i === 3
                        ? pageViews - pageValues.reduce((a, b) => a + b, 0)
                        : pageValues[i],
                  }),
                ),
              },
            ];
          }),
        ) as OverviewData["traffic"]),
    activity: [
      {
        id: "1",
        title: "Your website was published",
        at: "2026-10-23T14:20:00Z",
        tone: "good",
      },
      {
        id: "2",
        title: "Change request delivered",
        at: "2026-10-22T13:00:00Z",
        tone: "info",
      },
      {
        id: "3",
        title: "Content updated",
        at: "2026-10-21T09:00:00Z",
        tone: "neutral",
      },
      {
        id: "4",
        title: "Domain verification completed",
        at: "2026-10-20T12:00:00Z",
        tone: "good",
      },
    ],
    releases: [
      {
        id: "1",
        status: "ready",
        environment: "production",
        created_at: "2026-10-23T14:18:00Z",
        finished_at: "2026-10-23T14:20:00Z",
      },
      {
        id: "2",
        status: "ready",
        environment: "production",
        created_at: "2026-10-20T10:15:00Z",
        finished_at: "2026-10-20T10:16:35Z",
      },
    ],
    subscription: {
      name: "Vigil Care",
      status: "active",
      renewsAt: "2026-11-14T12:00:00Z",
      cancels: false,
    },
    openRequests: 2,
    canExport: false,
    canRequest: true,
    otherProjects: 0,
  };
}
