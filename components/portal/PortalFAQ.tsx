"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PortalSection from "./PortalSection";
import { faqItems } from "./portalData";

export default function PortalFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PortalSection
      eyebrow="Client FAQ"
      title="Questions clients usually ask right after payment."
      description="This section removes uncertainty before the project starts."
    >
      <div className="space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <button
              key={item.question}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 text-left transition hover:bg-[color:var(--bg-surface-soft)]"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium text-[color:var(--text-primary)]">
                  {item.question}
                </h3>

                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[color:var(--text-secondary)] transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isOpen && (
                <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">
                  {item.answer}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </PortalSection>
  );
}