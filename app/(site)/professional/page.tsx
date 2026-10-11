import { redirect } from "next/navigation";
import { PACKAGE_FINDER_HREF } from "@/lib/vigil/package-finder";

export default async function ProfessionalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  }
  redirect(`${PACKAGE_FINDER_HREF}${params.size ? `?${params}` : ""}`);
}
