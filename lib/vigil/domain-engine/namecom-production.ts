import "server-only";
/** Fixed production origin and account-scoped references. Writes require server authority;
 * no production factory is connected to customer routes until release approval. */
export { NamecomProductionRegistrar, namecomAccountScope } from "./namecom-core";
export type { NamecomLiveAuthority } from "./namecom-core";
