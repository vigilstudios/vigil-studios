import "server-only";
import { z } from "zod";
import type { RegistrantContact } from "./contracts";
import { registrantSchema } from "./validation";
import { DomainEngineError } from "./errors";

export const OPENPROVIDER_CONTACT_FIELDS = [
  { key: "street_name", label: "Street name", required: true },
  { key: "house_number", label: "House or building number", required: true },
  {
    key: "phone_country_code",
    label: "Phone country code (for example +1)",
    required: true,
  },
  { key: "phone_area_code", label: "Phone area code", required: true },
  {
    key: "phone_subscriber_number",
    label: "Phone number without country or area code",
    required: true,
  },
];
const parts = z.object({
  street_name: z.string().trim().min(1).max(150),
  house_number: z.string().trim().min(1).max(30),
  phone_country_code: z.string().regex(/^\+[1-9]\d{0,2}$/),
  phone_area_code: z.string().regex(/^[1-9]\d{0,5}$/),
  phone_subscriber_number: z.string().regex(/^\d{3,12}$/),
});
/** Never guess the registrant's street/phone parts or substitute the agency. */
export function openproviderContactPayload(
  raw: RegistrantContact,
  correlationId: string,
) {
  const contact = registrantSchema.parse(raw);
  const parsed = parts.safeParse(contact.additional);
  if (!parsed.success || !z.string().uuid().safeParse(correlationId).success)
    throw new DomainEngineError(
      "registrant_details_required",
      "Confirm the registrant's street, building number and phone details before checkout.",
    );
  const p = parsed.data;
  if (
    `${p.phone_country_code}${p.phone_area_code}${p.phone_subscriber_number}` !==
    contact.phone
  )
    throw new DomainEngineError(
      "registrant_phone_mismatch",
      "The phone parts must match the international phone number you approved.",
    );
  return {
    name: {
      first_name: contact.firstName,
      last_name: contact.lastName,
      full_name: `${contact.firstName} ${contact.lastName}`,
    },
    email: contact.email,
    ...(contact.organization ? { company_name: contact.organization } : {}),
    address: {
      street: p.street_name,
      number: p.house_number,
      ...(contact.address.line2 ? { suffix: contact.address.line2 } : {}),
      city: contact.address.city,
      state: contact.address.region,
      country: contact.address.country,
      zipcode: contact.address.postalCode,
    },
    phone: {
      country_code: p.phone_country_code,
      area_code: p.phone_area_code,
      subscriber_number: p.phone_subscriber_number,
    },
    comments: `Vigil consent ${correlationId}`,
  };
}
