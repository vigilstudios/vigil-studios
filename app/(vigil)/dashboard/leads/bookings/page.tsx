import { redirect } from "next/navigation";

/** Preserve saved appointment links after moving Bookings out of Lead Hub. */
export default async function LegacyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      query.append(key, item);
  }
  redirect(`/dashboard/bookings${query.size ? `?${query}` : ""}`);
}
