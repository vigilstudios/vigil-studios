import { VigilError } from "@/lib/vigil/auth/errors";

/** Safe to surface: never include provider payloads, credentials or contact data. */
export class DomainEngineError extends VigilError {
  constructor(code: string, message: string, status = 422) {
    super(code, message, status);
    this.name = "DomainEngineError";
  }
}

/** Only use before any billable registrar request has been submitted. */
export class RegistrationNotSubmittedError extends DomainEngineError {
  constructor() {
    super(
      "registration_not_submitted",
      "Domain checkout is temporarily unavailable. Vigil needs to review registrar funding.",
      503,
    );
  }
}
