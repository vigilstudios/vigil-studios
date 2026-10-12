import { handleContact } from "@/lib/vigil/contact/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ websiteId: string }> };
async function handler(request: Request, context: Context) {
  return handleContact(request, (await context.params).websiteId);
}
export { handler as GET, handler as POST, handler as OPTIONS };
