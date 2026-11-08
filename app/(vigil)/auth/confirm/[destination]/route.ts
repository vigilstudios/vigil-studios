import { NextRequest } from "next/server";
import { GET as confirm } from "../route";
import { GET as callback } from "../../callback/route";
import { decodeEmailDestination } from "@/lib/vigil/auth/email-destination";
import { NEXT_COOKIE } from "@/lib/vigil/auth/next-cookie";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ destination: string }> },
) {
  const { destination } = await params,
    url = request.nextUrl.clone();
  url.searchParams.set("next", decodeEmailDestination(destination));
  const forwarded = new NextRequest(url, { headers: request.headers });
  forwarded.cookies.set(NEXT_COOKIE, decodeEmailDestination(destination));
  // Default provider templates return a PKCE code; the branded token-hash template also works on another device.
  return url.searchParams.has("code")
    ? callback(forwarded)
    : confirm(forwarded);
}
