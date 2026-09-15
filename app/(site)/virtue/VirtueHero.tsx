"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { VelarisBackground } from "@/components/site/VelarisBackground";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { VirtueSpeech, useSpeaking } from "@/components/vigil/VirtueSpeech";

/** Virtue introduces herself the way she does inside the product. */
export function VirtueHero() {
  const speech = useSpeaking();
  const [spoken, setSpoken] = useState(false);
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-40">
      <VelarisBackground className="absolute inset-0 -z-10 h-full w-full" grain={0.05} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(to_bottom,transparent,var(--bg-primary))]" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
        <VirtueOrb size="xl" state={speech.speaking ? "talking" : "idle"} />
        <div className="mt-8 min-h-[8rem] w-full">
          <VirtueSpeech
            lines={[
              { text: "Hello. I'm Virtue.", emphasis: true },
              { text: "I work inside Vigil. Today I set up every customer: your sign-in, your business details, your photos and your domain, then I hand it all to the team." },
              { text: "Soon, on Growth and Priority, I keep going after launch: following up leads, texting back missed calls, asking happy customers for reviews." },
            ]}
            onStart={speech.onStart}
            onDone={() => { speech.onDone(); setSpoken(true); }}
          />
        </div>
        <div className={clsx("mt-6 flex flex-col gap-3 transition-opacity duration-700 sm:flex-row", spoken ? "opacity-100" : "opacity-0")}>
          <Link href="/express" className="btn-primary min-h-12 !px-6 text-sm font-semibold">Start with a template <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <a href="#today" className="btn-secondary min-h-12 !px-6 text-sm">What she does today</a>
        </div>
      </div>
    </section>
  );
}
