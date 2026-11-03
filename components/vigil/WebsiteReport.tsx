import Link from "next/link";
import { PageHeader } from "./ui";
import { WebsiteMeasurementsView } from "./WebsiteMeasurements";
import { RANGES, type ReportRange } from "@/lib/vigil/overview/model";
import type { WebsiteMeasurements } from "@/lib/vigil/measurements/contract";
import {
  measurementReports,
  overviewHref,
  type MeasurementReport,
} from "@/lib/vigil/measurements/navigation";

/** A focused report reached from Overview; source access stays in the server route. */
export function WebsiteReport({
  site,
  sites,
  data,
  report,
  range,
}: {
  site: { id: string; name: string };
  sites: { id: string; name: string }[];
  data: WebsiteMeasurements;
  report: MeasurementReport;
  range: ReportRange;
}) {
  const definition = measurementReports[report];
  return (
    <div>
      <nav aria-label="Breadcrumb" className="vm-breadcrumb">
        <Link href={overviewHref(site.id, range)}>Overview</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{definition.title}</span>
      </nav>
      <PageHeader
        eyebrow={site.name}
        title={definition.title}
        description={definition.description}
        actions={
          <Link
            href={overviewHref(site.id, range)}
            className="btn-secondary text-sm"
          >
            Back to overview
          </Link>
        }
      />
      {sites.length > 1 || report === "traffic" ? (
        <form method="get" className="vm-site-picker">
          <input type="hidden" name="report" value={report} />
          {sites.length > 1 ? (
            <>
              <label htmlFor="measurement-website">Website</label>
              <select
                id="measurement-website"
                name="website"
                defaultValue={site.id}
              >
                {sites.map((row) => (
                  <option value={row.id} key={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <input type="hidden" name="website" value={site.id} />
          )}
          {report === "traffic" ? (
            <>
              <label htmlFor="measurement-range">Period</label>
              <select
                id="measurement-range"
                name="range"
                defaultValue={String(range)}
              >
                {RANGES.map((days) => (
                  <option key={days} value={days}>
                    {days} days
                  </option>
                ))}
              </select>
            </>
          ) : (
            <input type="hidden" name="range" value={range} />
          )}
          <button className="btn-secondary text-sm" type="submit">
            Apply
          </button>
        </form>
      ) : null}
      <WebsiteMeasurementsView data={data} report={report} range={range} />
    </div>
  );
}
