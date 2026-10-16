import "server-only";
/** Rollback switch for discovery/handoff only. Customer DNS automation has no enable flag. */
export function domainHandoffEnabled(): boolean { return process.env.DOMAIN_HANDOFF_ENABLED === "true"; }
