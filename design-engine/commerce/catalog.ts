import { z } from "zod";
import { commerceIdSchema as id } from "./types";
const label = z.string().trim().min(1).max(80);
const unique = <T extends { id: string }>(values: T[]) =>
  new Set(values.map((v) => v.id)).size === values.length;
export const catalogQuerySchema = z
  .object({ filters: z.record(id, z.array(id).max(20)), sort: id })
  .strict();
export const catalogPresentationSchema = z
  .object({
    scope: z.enum(["provided-slice", "host-results"]),
    filters: z
      .array(
        z
          .object({
            id,
            label,
            values: z
              .array(z.object({ id, label }).strict())
              .min(1)
              .max(20)
              .refine(unique),
          })
          .strict(),
      )
      .max(8)
      .refine(unique),
    sorts: z
      .array(z.object({ id, label }).strict())
      .min(1)
      .max(8)
      .refine(unique),
    selected: catalogQuerySchema,
    resultCount: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (v) =>
      v.sorts.some((s) => s.id === v.selected.sort) &&
      Object.entries(v.selected.filters).every(
        ([key, values]) =>
          v.filters.some(
            (f) =>
              f.id === key &&
              values.every((value) => f.values.some((v) => v.id === value)),
          ) && new Set(values).size === values.length,
      ),
    "Selection must reference declared filters and sorting choices",
  );
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
/** A client host owns query execution, pending state and replacement result records. */
export type CatalogBinding = {
  query: CatalogQuery;
  onQueryChange: (query: CatalogQuery) => void;
  pending?: boolean;
};
