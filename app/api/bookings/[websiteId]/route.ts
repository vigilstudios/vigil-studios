import { handleBookings } from "@/lib/vigil/bookings/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ websiteId: string }> };
async function handler(request: Request, context: Context) {
  return handleBookings(request, (await context.params).websiteId);
}
export { handler as GET, handler as POST, handler as OPTIONS };
