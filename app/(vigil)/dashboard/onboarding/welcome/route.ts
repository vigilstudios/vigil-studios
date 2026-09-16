import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/vigil/onboarding/constants";

/** Always enter a new customer's dashboard with Virtue's welcome visible. */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${requestOrigin(request)}/dashboard`, { status: 303 });
  response.cookies.set(ONBOARDING_SKIP_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
