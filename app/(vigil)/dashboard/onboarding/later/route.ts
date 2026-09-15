import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/vigil/onboarding/constants";

/**
 * "Look around first" / "Do this later": a session cookie that keeps
 * Virtue's welcome overlay away until the browser is closed; the Overview's
 * "Finish setting up" card stays. Not httpOnly so the page can clear it.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${requestOrigin(request)}/dashboard`, { status: 303 });
  if (request.nextUrl.searchParams.get("clear") === "1") {
    // ?clear=1 brings Virtue's welcome back (used from "Start" on the Overview card).
    response.cookies.set(ONBOARDING_SKIP_COOKIE, "", { path: "/", maxAge: 0 });
  } else {
    response.cookies.set(ONBOARDING_SKIP_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: false });
  }
  return response;
}
