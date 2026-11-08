import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/vigil/auth/session";
import {
  accountDirectorySchema,
  type AccountFilter,
} from "@/lib/vigil/accounts/directory";
export async function listCustomerAccounts(
  filter: AccountFilter,
  search: string,
  page: number,
) {
  await requireStaff("/admin/organizations");
  const client = await createClient();
  const { data, error } = await client.rpc("list_customer_accounts", {
    p_filter: filter,
    p_search: search,
    p_page: page,
  });
  if (error) throw error;
  return accountDirectorySchema.parse(data);
}
