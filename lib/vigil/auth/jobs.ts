import "server-only";
import { timingSafeEqual } from "node:crypto";
export function authorizedJobRequest(request: Request): boolean {
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return [process.env.VIGIL_JOBS_SECRET, process.env.CRON_SECRET]
    .filter((secret): secret is string => Boolean(secret))
    .some((secret) => {
      const expected = Buffer.from(`Bearer ${secret}`);
      return (
        actual.length === expected.length && timingSafeEqual(actual, expected)
      );
    });
}
