"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Keep a customer's open dashboard current while a provider build is running. */
export function DeploymentStatusRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [active, router]);

  return null;
}
