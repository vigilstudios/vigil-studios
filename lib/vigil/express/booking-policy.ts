import type { ExpressDraft } from "./document";

/** Recognize the versioned legacy restaurant, never arbitrary customer markup. */
export function legacyRestaurant(html: string): boolean {
  return (
    /<script id="restaurant-config" type="application\/json">/.test(html) &&
    /<form id="booking-form"(?: data-vigil-contact-default="v1")?>/.test(
      html,
    ) &&
    html.includes('id="reserve" class="reservation section"')
  );
}
/** Default contact copy applies to new previews/exports; deployed customer repositories stay frozen. */
export function contactFirstHtml(html: string): string {
  if (html.includes('data-vigil-contact-default="v1"')) return html;
  if (legacySalon(html)) return contactFirstSalon(html);
  if (!legacyRestaurant(html)) return contactFirstOther(html);
  return html
    .replace(
      '<div class="booking" data-reveal>',
      '<div class="booking" data-reveal data-vigil-booking-compatible="v1">',
    )
    .replace(
      /(<form id="booking-form">)[\s\S]*?<\/form>/,
      `$1<div class="fields"><label>NAME<input name="name" autocomplete="name" maxlength="120" required></label><label>EMAIL<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label>MESSAGE<textarea name="message" rows="3" maxlength="2000" required></textarea></label></div><button type="submit" class="button"><span>Send a message</span><span aria-hidden="true">↗</span></button><p class="form-status" role="status"></p><a class="email-draft" hidden>Open email draft</a></form>`,
    )
    .replace(
      '<form id="booking-form">',
      '<form id="booking-form" data-vigil-contact-default="v1">',
    )
    .replace(
      "</form><noscript>",
      '</form><div data-vigil-booking-slot="v1" hidden></div><noscript>',
    )
    .replace(/<h3>A table for you<\/h3>/, "<h3>Let’s talk</h3>")
    .replace(/05 \/ LET US SAVE YOU A SEAT/g, "05 / GET IN TOUCH")
    .replace(/Book a table/g, "Contact us")
    .replace(
      /Example website\. This form does not make a reservation\./g,
      "Example website. This contact form does not send a message.",
    )
    .replace(
      /Bringing 7 or more\? Call us and we will make room\./g,
      "For reservations or group visits, please call us.",
    )
    .replace(
      /(<script id="restaurant-config" type="application\/json">)([\s\S]*?)(<\/script>)/,
      (_match, open, raw, close) => {
        const config = JSON.parse(raw);
        config.mode = "preview";
        config.endpoint = "";
        config.copy = {
          ...config.copy,
          primary_cta: "Contact us",
          preview_submit: "Send a message",
          preview_result: "Preview only. Your message has not been sent.",
          email_subject: "Website inquiry",
          success:
            "Your inquiry was received. Please contact the business to arrange a reservation.",
        };
        return open + JSON.stringify(config).replace(/</g, "\\u003c") + close;
      },
    )
    .replace(
      "</head>",
      "<style>#booking-form textarea{width:100%;resize:vertical;background:transparent;color:inherit;border:0;border-bottom:1px solid currentColor;font:inherit;padding:12px 0}#booking-form .fields{grid-template-columns:1fr}#booking-form label{min-width:0}#booking-form input{min-width:0;width:100%;border:0;border-bottom:1px solid currentColor;background:transparent;color:inherit;font:inherit;padding:12px 0}</style></head>",
    );
}
export function hasNativeBookingComponent(draft: ExpressDraft): boolean {
  return draft.kind === "html"
    ? legacyRestaurant(draft.html) || legacySalon(draft.html)
    : draft.site.pages.some((page) =>
        page.sections.some(
          (section) => section.component === "contact.booking",
        ),
      );
}

export function legacySalon(html: string): boolean {
  return (
    html.includes('<script id="salon-config" type="application/json">') &&
    html.includes('id="book" class="booking section"') &&
    /<form id="booking-form"/.test(html)
  );
}
function contactConfig(html: string, id: string) {
  const pattern = new RegExp(
    `(<script id="${id}" type="application/json">)([\\s\\S]*?)(<\\/script>)`,
  );
  return html.replace(pattern, (_match, open, raw, close) => {
    const config = JSON.parse(raw);
    config.mode = "preview";
    config.endpoint = "";
    config.copy = {
      ...config.copy,
      primary_cta: "Contact us",
      preview_submit: "Send a message",
      submit: "Send a message",
      preview_result: "Preview only. Your message has not been sent.",
      email_subject: "Website inquiry",
      success: "Your message was received. The business will be in touch.",
    };
    return open + JSON.stringify(config).replace(/</g, "\\u003c") + close;
  });
}
function contactFirstSalon(html: string) {
  const form =
    '<form id="booking-form" data-vigil-contact-default="v1"><div class="fields"><label class="field"><span class="label">YOUR NAME</span><input name="name" autocomplete="name" maxlength="120" required></label><label class="field"><span class="label">EMAIL</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label class="field field-wide"><span class="label">YOUR MESSAGE</span><textarea name="message" rows="3" maxlength="2000" required></textarea></label></div><button type="submit" class="button"><span>Send a message</span><span aria-hidden="true">↗</span></button><p class="form-status" role="status"></p><a class="email-draft" hidden>Open email draft</a></form><div data-vigil-booking-slot="v1" hidden></div>';
  return contactConfig(
    html
      .replace(/<form id="booking-form">[\s\S]*?<\/form>/, form)
      .replace(
        '<div class="slip" data-reveal>',
        '<div class="slip" data-reveal data-vigil-booking-compatible="v1">',
      )
      .replace(/Book your time|Request your time/g, "Contact us")
      .replace(/06 \/ BOOK YOUR TIME/g, "06 / GET IN TOUCH")
      .replace(/A time for you/g, "Let’s talk")
      .replace(
        "Tell us what you would like and who you would like it with. We will confirm a time that suits your day.",
        "Tell us what you have in mind. Our team will help you find the next step.",
      )
      .replace(
        /(<p[^>]*>)This is a request, not a confirmed booking\.[^<]*(<\/p>)/g,
        "$1For appointments, please call or send us a message.$2",
      )
      .replace(
        "</head>",
        "<style>#booking-form textarea{width:100%;background:transparent;border:0;border-bottom:1px solid currentColor;font:inherit;color:inherit;min-height:100px;resize:vertical}#booking-form .fields{grid-template-columns:1fr}#booking-form .field{grid-column:1}</style></head>",
      ),
    "salon-config",
  );
}
/** Existing request/enquiry forms remain contact capture, with no calendar availability implied. */
function contactFirstOther(html: string) {
  const id = ["medical-config", "home-services-config", "retail-config"].find(
    (id) => html.includes(`<script id="${id}" type="application/json">`),
  );
  const auto =
    html.includes('id="site-config"') &&
    html.includes('id="request-vehicle"') &&
    (html.includes('id="request-day"') || html.includes('id="request-email"'));
  if (!id && !auto) return html;
  let output = html.replace(
    /<form(?=[^>]*\bid="(?:request|enquiry)-form")[^>]*>/,
    (tag) => tag.replace(/>$/, ' data-vigil-contact-default="v1">'),
  );
  output = output.replace(
    /<label class="field[^\"]*"><span class="label">(?:Phone or email \*|Email or phone)<\/span><input name="contact"[^>]+><\/label>/,
    '<label class="field"><span class="label">Email</span><input name="email" type="email" autocomplete="email" maxlength="254" required></label><label class="field"><span class="label">Phone (optional)</span><input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>',
  );
  if (id === "medical-config")
    output = output
      .replace(/Request a visit/g, "Contact the office")
      .replace(/Send visit request/g, "Send a message");
  if (auto) {
    output = output
      .replace(
        /<div class="field" data-reveal>\s*<label class="label" for="request-day">[\s\S]*?<\/div>/,
        '<div class="field" data-reveal><label class="label" for="request-email">EMAIL *</label><input id="request-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>',
      )
      .replace(/Request an appointment/g, "Contact the shop")
      .replace(
        /<span class="mobile-label">Book<\/span>/g,
        '<span class="mobile-label">Contact</span>',
      )
      .replace(
        /(<a class="action dock-book"[^>]*><span>)Book<\/span>/g,
        "$1Contact</span>",
      );
  }
  return id ? contactConfig(output, id) : output;
}
