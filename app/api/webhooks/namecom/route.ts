import type { NextRequest } from "next/server";
import { handleNamecomWebhook } from "@/lib/vigil/domain-engine/namecom-webhook-api";
export async function POST(request:NextRequest){return handleNamecomWebhook(request,"test");}
