/** Password rules shared by the form and the action. Supabase enforces its own minimum too. */
export const MIN_PASSWORD_LENGTH = 8;

/** True once the person has set a password (recorded in user metadata by setPassword). */
export function hasPassword(user: { user_metadata?: Record<string, unknown> | null } | null | undefined): boolean {
  return Boolean(user?.user_metadata?.has_password);
}
