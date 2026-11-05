"use client";
import { BookingWidget } from "../../forms/WebsiteBookingHost";
import type { SectionInstance } from "../../composition/schemas";
export function NativeBooking(section: SectionInstance<"contact.booking">) {
  return (
    <section
      id={section.id}
      className="de-section"
      data-surface={section.surface}
      data-structure={section.structure}
    >
      <div
        className="de-container"
        style={{
          paddingBlock: "var(--de-section-space, 64px)",
          maxWidth: 900,
          marginInline: "auto",
          ...(section.structure === "panel"
            ? {
                border: "1px solid currentColor",
                borderRadius: 16,
                padding: 32,
              }
            : {}),
        }}
      >
        <BookingWidget
          headingLevel="h2"
          title={section.content.title}
          introduction={section.content.introduction}
        />
      </div>
    </section>
  );
}
