import type { NextRequest } from "next/server";
import { handleDomainStripeWebhook } from "@/lib/vigil/domain-engine/stripe-webhook-api";
export async function POST(request:NextRequest){return handleDomainStripeWebhook(request,"test");}
