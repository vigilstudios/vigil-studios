/**
 * Typed failures raised by the Data Access Layer and services. Route code maps
 * them to redirects or HTTP responses in one place (see `session.ts` and
 * `app/(vigil)/error.tsx`).
 */
export class VigilError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = "VigilError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthenticatedError extends VigilError {
  constructor(message = "Sign in to continue.") {
    super("unauthenticated", message, 401);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends VigilError {
  constructor(message = "You do not have access to this.") {
    super("forbidden", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends VigilError {
  constructor(message = "Not found.") {
    super("not_found", message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends VigilError {
  readonly issues: Record<string, string[]>;

  constructor(message: string, issues: Record<string, string[]> = {}) {
    super("validation", message, 422);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class ProviderNotConfiguredError extends VigilError {
  constructor(provider: string) {
    super("provider_not_configured", `${provider} is not configured for this environment.`, 501);
    this.name = "ProviderNotConfiguredError";
  }
}

export class RateLimitedError extends VigilError {
  constructor(message = "Too many attempts. Please wait a few minutes and try again.") {
    super("rate_limited", message, 429);
    this.name = "RateLimitedError";
  }
}

export class ProviderError extends VigilError {
  readonly provider: string;
  readonly retryable: boolean;

  constructor(provider: string, message: string, options: { retryable?: boolean; status?: number } = {}) {
    super("provider_error", message, options.status ?? 502);
    this.name = "ProviderError";
    this.provider = provider;
    this.retryable = options.retryable ?? false;
  }
}

export function isVigilError(error: unknown): error is VigilError {
  return error instanceof VigilError;
}

/** Shape returned to the client by server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; issues?: Record<string, string[]> };

/**
 * Who reads the message. Customers get a plain sentence and never the text
 * of a provider (Stripe, Resend, GitHub, Vercel) or a configuration error;
 * the detail goes to the server log. Staff actions opt in to the detail.
 */
export type ErrorAudience = "customer" | "staff";

const CUSTOMER_MESSAGES: Record<string, string> = {
  provider_error: "We could not reach one of the services we depend on. Please try again in a moment.",
  provider_not_configured: "That is not available yet. Please try again later or write to hello@vigilstudios.co.",
};

export function toActionError(error: unknown, audience: ErrorAudience = "customer"): ActionResult<never> {
  if (error instanceof ValidationError) {
    return { ok: false, error: error.message, code: error.code, issues: error.issues };
  }
  if (isVigilError(error)) {
    const generic = audience === "customer" ? CUSTOMER_MESSAGES[error.code] : undefined;
    if (generic) {
      console.error(`[action] ${error.code}:`, error.message);
      return { ok: false, error: generic, code: error.code };
    }
    return { ok: false, error: error.message, code: error.code };
  }
  console.error("Unhandled action error:", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}
