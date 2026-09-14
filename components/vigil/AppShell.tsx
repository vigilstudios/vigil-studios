import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AppFrame } from "./AppFrame";
import { SIDEBAR_COOKIE, type NavGroup } from "./nav";

/** Server wrapper: reads the persisted sidebar state so the first paint is right. */
export async function AppShell({
  groups,
  homeHref,
  workspace,
  account,
  children,
}: {
  groups: NavGroup[];
  homeHref: string;
  workspace: ReactNode;
  account: ReactNode;
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";
  return (
    <AppFrame groups={groups} homeHref={homeHref} workspace={workspace} account={account} initialCollapsed={initialCollapsed}>
      {children}
    </AppFrame>
  );
}
