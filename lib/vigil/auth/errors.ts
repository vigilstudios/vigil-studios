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

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ValidationError) {
    return { ok: false, error: error.message, code: error.code, issues: error.issues };
  }
  if (isVigilError(error)) {
    return { ok: false, error: error.message, code: error.code };
  }
  console.error("Unhandled action error:", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}
