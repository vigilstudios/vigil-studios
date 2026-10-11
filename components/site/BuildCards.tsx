"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { PublicBuild } from "@/lib/vigil/queries/public-pricing";
import { formatMoney } from "@/lib/vigil/format";
import { PACKAGE_FINDER_HREF, PACKAGE_FINDER_LABEL } from "@/lib/vigil/package-finder";
import { BUILD_COPY } from "@/lib/site-copy";
import { Chip } from "./primitives";
import { Card, CardRow } from "./Cards";

const tone = { express: "accent", professional: "teal", custom: "violet" } as const;
const label = { express: "Fastest", professional: "Multi-page", custom: "Bespoke" } as const;

/** The three builds, paid once: rows in build_prices, copy from BUILD_COPY. */
export function BuildCards({ builds, bullets = 4 }: { builds: PublicBuild[]; bullets?: number }) {
  return (
    <CardRow className="md:mx-auto md:max-w-4xl md:grid-cols-3">
      {builds.map((b) => {
        const copy = BUILD_COPY[b.kind];
        return (
          <Card key={b.kind} className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 lg:p-6">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight">{b.name}</h3>
              <Chip tone={tone[b.kind]}>{label[b.kind]}</Chip>
            </div>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)] md:min-h-15">{copy?.tagline ?? b.description}</p>
            <p className="mt-5 text-3xl font-semibold tracking-tight">
              {b.amountCents != null ? formatMoney(b.amountCents, b.currency).replace(/\.00$/, "") : "Quoted"}
              <span className="text-sm font-normal text-[color:var(--text-secondary)]"> {b.amountCents != null ? "once" : "after a short call"}</span>
            </p>
            <ul className="mt-4 space-y-2 text-[13px] text-[color:var(--text-secondary)]">
              {(copy?.bullets ?? []).slice(0, bullets).map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Link href={PACKAGE_FINDER_HREF} className="btn-primary inline-flex min-h-11 w-full !px-4 !py-2 text-sm font-semibold">{PACKAGE_FINDER_LABEL} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </div>
          </Card>
        );
      })}
    </CardRow>
  );
}
