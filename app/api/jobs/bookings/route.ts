import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizedJobRequest } from "@/lib/vigil/auth/jobs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!authorizedJobRequest(request))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.VIGIL_BOOKINGS_ENABLED !== "true")
    return Response.json({ enabled: false });
  const { data, error } = await createAdminClient().rpc(
    "expire_booking_requests",
  );
  return error
    ? Response.json({ error: "booking_expiry_failed" }, { status: 503 })
    : Response.json({ expired: data });
}
