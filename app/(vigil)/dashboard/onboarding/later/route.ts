import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/vigil/auth/origin";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/vigil/onboarding/constants";

/**
 * "Do this later": remember the choice for a week so the Overview stops
 * redirecting into the wizard, and keep the "Finish setting up" card instead.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${requestOrigin(request)}/dashboard`, { status: 303 });
  response.cookies.set(ONBOARDING_SKIP_COOKIE, "1", { path: "/", maxAge: 7 * 86_400, sameSite: "lax", httpOnly: true });
  return response;
}
