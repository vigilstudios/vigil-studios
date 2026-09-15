"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { FAQ } from "@/lib/site-copy";

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" alt fill>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <Reveal>
            <SectionIntro eyebrow="Questions" title="The things people ask before they buy." lead="Straight answers. If yours is not here, email hello@vigilstudios.co and a person replies." />
          </Reveal>
          <Reveal delay={0.1}>
          <ul className="divide-y divide-[color:var(--border)] rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium">
                    {item.q}
                    <ChevronDown className={clsx("h-4 w-4 shrink-0 text-[color:var(--text-secondary)] transition-transform", isOpen && "rotate-180")} />
                  </button>
                  <div className={clsx("grid transition-[grid-template-rows] duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-6 text-[color:var(--text-secondary)]">{item.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
