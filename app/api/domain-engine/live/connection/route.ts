import type { NextRequest } from "next/server";
import { handleManagedConnection } from "@/lib/vigil/domain-engine/connection-api";
export async function POST(request: NextRequest) {
  return handleManagedConnection(request, "live");
}
