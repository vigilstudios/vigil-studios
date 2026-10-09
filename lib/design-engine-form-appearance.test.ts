import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { inquiryFormAppearanceSchema, inquiryFormPresets } from "../design-engine/forms/appearance";
import { InquiryForm } from "../design-engine/forms/InquiryForm";
import { parseSection } from "../design-engine/composition/schemas";
import { makeEndingSection, inquiryPreset } from "../design-engine/preview/ending-fixtures";
import { makeComplexSiteFixture } from "../design-engine/preview/composition/site-fixture";
import { serializeSite, deserializeSite } from "../design-engine/site/persistence";
import { renderSection } from "../design-engine/composition/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";

describe("Editable inquiry appearance", () => {
  it.each(Object.entries(inquiryFormPresets))("%s persists on a contact section without changing form content or submission", (_, appearance) => {
    const original = makeEndingSection("contact.inquiry", "contact");
    const changed = parseSection({ ...original, formAppearance: appearance });
    expect(changed.content).toEqual(original.content);
    const site = makeComplexSiteFixture();
    site.pages[0].sections = [changed];
    expect(deserializeSite(serializeSite(site)).pages[0].sections[0]).toEqual(changed);
    const markup = renderToStaticMarkup(renderSection(changed));
    expect(markup).toContain('data-form-custom="true"');
    expect(markup).toContain(`data-field-style="${appearance.fieldStyle}"`);
    expect(markup).toContain(`data-action-shape="${appearance.submit.shape}"`);
  });
  it("bounds numeric controls and rejects arbitrary CSS and invalid colors", () => {
    for (const invalid of [{ padding: -1 }, { gap: 100 }, { maxWidth: 2000 }, { columns: 3 }, { textareaRows: 3.5 }, { textSize: 9 }, { background: "url(https://example.com/image)" }, { borderColor: "red;position:fixed" }, { style: "display:none" }, { submit: { hover: "unknown" } }]) {
      expect(inquiryFormAppearanceSchema.safeParse(invalid).success).toBe(false);
    }
    expect(inquiryFormAppearanceSchema.parse({ textColor: "#ABCDEF", fieldBackground: "#fffaf0", submit: { icon: null, width: "full" } })).toEqual({ textColor: "#ABCDEF", fieldBackground: "#fffaf0", submit: { icon: null, width: "full" } });
  });
  it("renders custom field geometry and accessible labels while preserving honest delivery state", () => {
    const config = inquiryPreset("collaboration");
    const markup = renderToStaticMarkup(createElement(InquiryForm, { config, appearance: { ...inquiryFormPresets.editorial, textareaRows: 8, fieldHeight: 64, textColor: "#123456", submit: { alignment: "center", width: "full", icon: "mail" } } }));
    expect(markup).toContain('rows="8"');
    expect(markup).toContain("--de-form-field-height:64px");
    expect(markup).toContain("--de-form-text:#123456");
    expect(markup).toContain('data-action-width="full"');
    expect(markup).toContain('data-align="center"');
    expect(markup).toContain('aria-describedby=');
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain("disabled");
    expect(markup).toContain(config.unavailableMessage);
    expect(markup).not.toContain(config.successMessage);
  });
  it("retains the legacy appearance for existing forms", () => {
    const markup = renderToStaticMarkup(createElement(InquiryForm, { config: inquiryPreset("general") }));
    expect(markup).not.toContain('data-form-custom');
    expect(markup).toContain('rows="5"');
    expect(markup).toContain('de-action--primary');
  });
  it.each(["left", "center", "right"])("puts %s testimonial alignment on the shell containing the heading", alignment => {
    const section = parseSection({ ...makeSection("proof.moving-chorus", "testimonials"), alignment });
    const markup = renderToStaticMarkup(renderSection(section));
    expect(markup).toContain(`class="de-proof de-proof-e06" data-align="${alignment}"`);
    expect(markup).toContain('class="de-proof-intro"');
  });
});
